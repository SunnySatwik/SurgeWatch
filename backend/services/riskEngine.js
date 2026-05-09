/**
 * SurgeWatch Risk Engine
 * 
 * Evaluates the current operational state of a hospital and produces
 * a composite risk score with classification.
 * 
 * Inputs: occupancy, forecast trend, staffing, weather, lab signals
 * Output: { level, score, factors, timestamp }
 * 
 * Thresholds:
 *   LOW:      0–35
 *   MODERATE: 36–60
 *   HIGH:     61–80
 *   CRITICAL: 81–100
 */

const db = require('../db');

/**
 * Evaluate the current risk for a hospital.
 * 
 * @param {number} hospitalId
 * @returns {{ level: string, score: number, factors: Array, recommendations: Array, timestamp: string }}
 */
function evaluateRisk(hospitalId = 1) {
    let score = 0;
    const factors = [];

    // ── 1. Bed Occupancy (0–30 points) ────────────────────────────────────
    const beds = db.query(
        `SELECT department, total_beds, occupied_beds, occupancy_pct 
         FROM bed_status WHERE hospital_id = ? 
         AND timestamp = (SELECT MAX(timestamp) FROM bed_status WHERE hospital_id = ?)`,
        [hospitalId, hospitalId]
    );

    const totalBeds = beds.reduce((sum, b) => sum + b.total_beds, 0);
    const totalOccupied = beds.reduce((sum, b) => sum + b.occupied_beds, 0);
    const overallOccupancy = totalBeds > 0 ? (totalOccupied / totalBeds) * 100 : 0;

    if (overallOccupancy > 90) {
        score += 30;
        factors.push({ factor: 'Bed occupancy critical', value: `${overallOccupancy.toFixed(1)}%`, impact: 30 });
    } else if (overallOccupancy > 80) {
        score += 20;
        factors.push({ factor: 'Bed occupancy high', value: `${overallOccupancy.toFixed(1)}%`, impact: 20 });
    } else if (overallOccupancy > 70) {
        score += 10;
        factors.push({ factor: 'Bed occupancy elevated', value: `${overallOccupancy.toFixed(1)}%`, impact: 10 });
    }

    // Check specific critical departments
    const icuBeds = beds.find(b => b.department === 'ICU');
    if (icuBeds && icuBeds.occupancy_pct > 85) {
        score += 10;
        factors.push({ factor: 'ICU near capacity', value: `${icuBeds.occupancy_pct.toFixed(1)}%`, impact: 10 });
    }

    const erBeds = beds.find(b => b.department === 'ER');
    if (erBeds && erBeds.occupancy_pct > 85) {
        score += 10;
        factors.push({ factor: 'ER near capacity', value: `${erBeds.occupancy_pct.toFixed(1)}%`, impact: 10 });
    }

    // ── 2. Admission Trend (0–20 points) ──────────────────────────────────
    const recentMetrics = db.query(
        `SELECT total_admissions, occupancy_pct FROM operational_metrics 
         WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 3`,
        [hospitalId]
    );

    if (recentMetrics.length >= 2) {
        const latest = recentMetrics[0].total_admissions;
        const previous = recentMetrics[1].total_admissions;
        const trend = latest - previous;

        if (trend > 10) {
            score += 20;
            factors.push({ factor: 'Admissions spiking', value: `+${trend} from last period`, impact: 20 });
        } else if (trend > 5) {
            score += 10;
            factors.push({ factor: 'Admissions rising', value: `+${trend} from last period`, impact: 10 });
        }
    }

    // ── 3. Staffing Status (0–20 points) ──────────────────────────────────
    const staffing = db.query(
        `SELECT department, nurse_patient_ratio, coverage_status 
         FROM staffing_status WHERE hospital_id = ? 
         AND timestamp = (SELECT MAX(timestamp) FROM staffing_status WHERE hospital_id = ?)`,
        [hospitalId, hospitalId]
    );

    const criticalStaffing = staffing.filter(s => s.coverage_status === 'critical');
    const strainedStaffing = staffing.filter(s => s.coverage_status === 'strained');

    if (criticalStaffing.length > 0) {
        score += 20;
        factors.push({ factor: 'Critical staffing shortage', value: `${criticalStaffing.length} department(s)`, impact: 20 });
    } else if (strainedStaffing.length > 0) {
        score += 10;
        factors.push({ factor: 'Staffing strained', value: `${strainedStaffing.length} department(s)`, impact: 10 });
    }

    // ── 4. Weather Severity (0–15 points) ─────────────────────────────────
    const weather = db.get(
        'SELECT * FROM weather_context WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 1',
        [hospitalId]
    );

    if (weather) {
        if (weather.surge_impact_level === 'critical') {
            score += 15;
            factors.push({ factor: 'Severe weather conditions', value: `Code ${weather.weather_code}`, impact: 15 });
        } else if (weather.surge_impact_level === 'high') {
            score += 10;
            factors.push({ factor: 'Adverse weather', value: `${weather.temperature}°C, ${weather.humidity}% humidity`, impact: 10 });
        } else if (weather.surge_impact_level === 'moderate') {
            score += 5;
            factors.push({ factor: 'Weather watch', value: `${weather.precipitation_probability}% precip prob`, impact: 5 });
        }
    }

    // ── 5. Lab Signals (0–15 points) ──────────────────────────────────────
    const labSignals = db.query(
        `SELECT test_type, positivity_rate, trend FROM lab_signals 
         WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 6`,
        [hospitalId]
    );

    const risingLabs = labSignals.filter(l => l.trend === 'rising' || l.trend === 'spike');
    const highPositivity = labSignals.filter(l => l.positivity_rate > 15);

    if (highPositivity.length > 0 && risingLabs.length > 0) {
        score += 15;
        factors.push({ factor: 'Lab positivity spike', value: `${highPositivity.length} test type(s) elevated`, impact: 15 });
    } else if (risingLabs.length > 0) {
        score += 8;
        factors.push({ factor: 'Lab signals trending up', value: `${risingLabs.length} test type(s)`, impact: 8 });
    }

    // ── Clamp and Classify ────────────────────────────────────────────────
    score = Math.min(100, Math.max(0, score));

    let level;
    if (score >= 81) level = 'CRITICAL';
    else if (score >= 61) level = 'HIGH';
    else if (score >= 36) level = 'MODERATE';
    else level = 'LOW';

    // No factors = baseline stable
    if (factors.length === 0) {
        factors.push({ factor: 'All systems nominal', value: 'Stable', impact: 0 });
    }

    const result = {
        level,
        score,
        factors,
        occupancy: Math.round(overallOccupancy * 10) / 10,
        beds: beds.map(b => ({
            department: b.department,
            occupied: b.occupied_beds,
            total: b.total_beds,
            occupancy: b.occupancy_pct
        })),
        timestamp: new Date().toISOString()
    };

    return result;
}

/**
 * Store a risk assessment snapshot in the database (via alerts if threshold breached).
 * Optionally accepts scenarioModifiers from the Operational Control Console to amplify scoring.
 */
function assessAndAlert(hospitalId = 1, scenarioModifiers = null) {
    const risk = evaluateRisk(hospitalId);

    // Apply scenario modifier amplifications
    if (scenarioModifiers) {
        let amplification = 0;
        const appliedFactors = [];

        if (scenarioModifiers.viral >= 2) { amplification += 18; appliedFactors.push({ factor: 'Sim: Viral surge active', value: 'Critical outbreak', impact: 18 }); }
        else if (scenarioModifiers.viral === 1) { amplification += 10; appliedFactors.push({ factor: 'Sim: Respiratory pressure elevated', value: 'Elevated positivity', impact: 10 }); }

        if (scenarioModifiers.staffing === -1) { amplification += 15; appliedFactors.push({ factor: 'Sim: Staffing deficit injected', value: 'Below-safe ratios', impact: 15 }); }

        if (scenarioModifiers.weather === 2) { amplification += 12; appliedFactors.push({ factor: 'Sim: Severe weather', value: 'Storm conditions', impact: 12 }); }
        else if (scenarioModifiers.weather === 1) { amplification += 6; appliedFactors.push({ factor: 'Sim: Adverse weather', value: 'Rain/moderate', impact: 6 }); }

        if (scenarioModifiers.traffic === 1) { amplification += 8; appliedFactors.push({ factor: 'Sim: Traffic critical', value: 'ETA compressed', impact: 8 }); }

        if (scenarioModifiers.crowd >= 2) { amplification += 10; appliedFactors.push({ factor: 'Sim: Mass gathering', value: 'Trauma surge expected', impact: 10 }); }
        else if (scenarioModifiers.crowd === 1) { amplification += 5; appliedFactors.push({ factor: 'Sim: Crowd pressure', value: 'Elevated intake', impact: 5 }); }

        // Inject scenario factors at the front and re-clamp
        risk.factors = [...appliedFactors, ...risk.factors];
        risk.score = Math.min(100, risk.score + amplification);

        // Reclassify after amplification
        if (risk.score >= 81) risk.level = 'CRITICAL';
        else if (risk.score >= 61) risk.level = 'HIGH';
        else if (risk.score >= 36) risk.level = 'MODERATE';
        else risk.level = 'LOW';

        risk.simulationActive = true;
    }

    // Create alert if risk is HIGH or CRITICAL
    if (risk.level === 'HIGH' || risk.level === 'CRITICAL') {
        const topFactors = risk.factors.slice(0, 3).map(f => f.factor).join(', ');

        db.run(
            `INSERT INTO alerts (hospital_id, severity, title, message, source)
             VALUES (?, ?, ?, ?, 'risk_engine')`,
            [
                hospitalId,
                risk.level === 'CRITICAL' ? 'critical' : 'high',
                `${risk.level} Risk Assessment — Score: ${risk.score}${risk.simulationActive ? ' [SIM ACTIVE]' : ''}`,
                `Risk factors: ${topFactors}. Overall occupancy: ${risk.occupancy}%. Immediate review recommended.`
            ]
        );
    }

    return risk;
}

module.exports = { evaluateRisk, assessAndAlert };
