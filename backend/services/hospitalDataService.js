const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/hospital');

// 1. LOAD OPERATIONAL DATASETS
async function loadDataset(filename) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        const data = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return [];
        }
        
        // Sort by timestamp descending so the latest is always at index 0
        return parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
        console.error(`[HospitalDataService] Error loading dataset ${filename}:`, error.message);
        return [];
    }
}

// Helper: Analyze short-term trend over a rolling window (up to 3 entries)
function analyzeTrend(data, extractor) {
    if (!data || data.length < 2) return { delta: 0, current: 0, previous: 0 };
    // Window of up to 3 points (0 is current, 1 is T-1, 2 is T-2)
    const window = data.slice(0, 3);
    const current = extractor(window[0]);
    const previous = extractor(window[window.length - 1]);
    
    const delta = previous !== 0 ? (current - previous) / Math.abs(previous) : (current > 0 ? 1 : 0);
    return { delta, current, previous };
}

// Helper: Derive trend state
function getTrendState(delta, thresholds = { rapid: 0.15, moderate: 0.05 }, higherIsWorse = true) {
    if (higherIsWorse) {
        if (delta >= thresholds.rapid) return 'rapidly worsening';
        if (delta >= thresholds.moderate) return 'worsening';
        if (delta <= -thresholds.moderate) return 'improving';
        return 'stable';
    } else {
        if (delta <= -thresholds.rapid) return 'rapidly worsening';
        if (delta <= -thresholds.moderate) return 'worsening';
        if (delta >= thresholds.moderate) return 'improving';
        return 'stable';
    }
}

// 2. DERIVE NORMALIZED OPERATIONAL STATE
function deriveOccupancyMetrics(bedData) {
    if (!bedData || bedData.length === 0) return { icuPressure: 'stable', erCongestion: 'stable', occupancyMomentum: 'stable', congestionTrajectory: 'stable', metrics: {}, unitPressures: [] };
    
    const latestTimestamp = bedData[0].timestamp;
    const currentBeds = bedData.filter(b => b.timestamp === latestTimestamp);
    
    const icu = currentBeds.find(b => b.department === 'ICU') || { occupiedBeds: 0, totalBeds: 1, boardingPatients: 0 };
    const er = currentBeds.find(b => b.department === 'Emergency') || { occupiedBeds: 0, totalBeds: 1, boardingPatients: 0 };
    
    const icuOccupancy = icu.occupiedBeds / Math.max(icu.totalBeds, 1);
    const erOccupancy = er.occupiedBeds / Math.max(er.totalBeds, 1);
    const totalOccupied = currentBeds.reduce((acc, curr) => acc + curr.occupiedBeds, 0);
    const totalCapacity = currentBeds.reduce((acc, curr) => acc + curr.totalBeds, 0);
    const overallOccupancy = totalOccupied / Math.max(totalCapacity, 1);
                             
    let icuPressure = 'stable';
    if (icuOccupancy > 0.9) icuPressure = 'critical';
    else if (icuOccupancy > 0.75) icuPressure = 'elevated';
    
    let erCongestion = 'stable';
    if (er.boardingPatients > 5 || erOccupancy > 0.9) erCongestion = 'volatile';
    else if (er.boardingPatients > 2 || erOccupancy > 0.8) erCongestion = 'elevated';

    // Temporal Trends
    const icuData = bedData.filter(b => b.department === 'ICU');
    const erData = bedData.filter(b => b.department === 'Emergency');
    
    const icuTrend = analyzeTrend(icuData, b => b.occupiedBeds / Math.max(b.totalBeds, 1));
    const erBoardingTrend = analyzeTrend(erData, b => b.boardingPatients);
    
    const occupancyMomentum = getTrendState(icuTrend.delta, { rapid: 0.1, moderate: 0.05 });
    const congestionTrajectory = getTrendState(erBoardingTrend.delta, { rapid: 0.2, moderate: 0.1 });

    return {
        icuPressure,
        erCongestion,
        occupancyMomentum,
        congestionTrajectory,
        metrics: {
            icuOccupancyRate: icuOccupancy,
            erOccupancyRate: erOccupancy,
            overallOccupancyRate: overallOccupancy,
            totalBoarding: currentBeds.reduce((acc, curr) => acc + (curr.boardingPatients || 0), 0),
            icuTrendDelta: icuTrend.delta
        },
        unitPressures: currentBeds.map(b => ({
            department: b.department,
            occupied: b.occupiedBeds,
            total: b.totalBeds,
            occupancyRate: b.occupiedBeds / Math.max(b.totalBeds, 1)
        }))
    };
}

function deriveStaffingMetrics(staffingData) {
    if (!staffingData || staffingData.length === 0) return { staffingStability: 'stable', staffingRecovery: 'stable', metrics: {} };
    
    const latestTimestamp = staffingData[0].timestamp;
    const currentStaffing = staffingData.filter(s => s.timestamp === latestTimestamp);
    
    let maxFatigue = 0;
    let totalNurses = 0;
    let totalTarget = 0;
    
    currentStaffing.forEach(s => {
        if (s.fatigueIndex > maxFatigue) maxFatigue = s.fatigueIndex;
        totalNurses += s.nursesAvailable;
        totalTarget += s.staffingTarget;
    });
    
    let staffingStability = 'stable';
    if (maxFatigue > 0.7) staffingStability = 'fragile';
    else if (maxFatigue > 0.5) staffingStability = 'strained';
    
    // Temporal Trend for Fatigue (we can aggregate max fatigue per timestamp)
    // Group by timestamp to find max fatigue per hour
    const fatigueHistory = [];
    const grouped = staffingData.reduce((acc, curr) => {
        if (!acc[curr.timestamp]) acc[curr.timestamp] = [];
        acc[curr.timestamp].push(curr);
        return acc;
    }, {});
    
    // Sort descending by timestamp
    const timestamps = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    timestamps.forEach(ts => {
        const maxF = Math.max(...grouped[ts].map(s => s.fatigueIndex));
        fatigueHistory.push({ fatigueIndex: maxF });
    });

    const fatigueTrend = analyzeTrend(fatigueHistory, h => h.fatigueIndex);
    const staffingRecovery = getTrendState(fatigueTrend.delta, { rapid: 0.15, moderate: 0.05 }, true);
    
    return {
        staffingStability,
        staffingRecovery,
        metrics: {
            maxFatigueIndex: maxFatigue,
            staffingCoverage: totalNurses / Math.max(totalTarget, 1),
            fatigueTrendDelta: fatigueTrend.delta
        }
    };
}

function deriveTransportMetrics(ambulanceData) {
    if (!ambulanceData || ambulanceData.length === 0) return { ambulanceFlow: 'normal', intakeAcceleration: 'stable', metrics: {} };
    
    const latest = ambulanceData[0];
    
    let ambulanceFlow = 'normal';
    if (latest.averageETA > 40 || latest.diversionActive) ambulanceFlow = 'critical intake compression';
    else if (latest.averageETA > 20) ambulanceFlow = 'delayed';
    
    // Temporal Trend
    const etaTrend = analyzeTrend(ambulanceData, d => d.averageETA);
    const trafficTrend = analyzeTrend(ambulanceData, d => d.trafficSeverity);
    
    let intakeAcceleration = 'stable';
    if (etaTrend.delta >= 0.25 || trafficTrend.delta >= 0.3) intakeAcceleration = 'rapidly worsening';
    else if (etaTrend.delta >= 0.1) intakeAcceleration = 'worsening';
    else if (etaTrend.delta <= -0.1) intakeAcceleration = 'improving';
    
    return {
        ambulanceFlow,
        intakeAcceleration,
        metrics: {
            averageETA: latest.averageETA,
            activeAmbulances: latest.activeAmbulances,
            diversionActive: latest.diversionActive,
            trafficSeverity: latest.trafficSeverity,
            etaTrendDelta: etaTrend.delta
        }
    };
}

function deriveRespiratoryMetrics(labData) {
    if (!labData || labData.length === 0) return { respiratoryPressure: 'normal', respiratoryEscalation: 'stable', metrics: {} };
    
    const latest = labData[0];
    
    let respiratoryPressure = 'normal';
    if (latest.respiratoryPositivityRate > 0.25) respiratoryPressure = 'elevated';
    else if (latest.respiratoryPositivityRate > 0.15) respiratoryPressure = 'moderate';
    
    // Temporal Trend
    const positivityTrend = analyzeTrend(labData, d => d.respiratoryPositivityRate);
    const respiratoryEscalation = getTrendState(positivityTrend.delta, { rapid: 0.15, moderate: 0.05 });

    return {
        respiratoryPressure,
        respiratoryEscalation,
        metrics: {
            positivityRate: latest.respiratoryPositivityRate,
            isolationDemandIndex: latest.isolationDemandIndex,
            viralPressure: latest.viralPressure,
            positivityTrendDelta: positivityTrend.delta
        }
    };
}

function deriveArrivalMetrics(arrivalData) {
    if (!arrivalData || arrivalData.length === 0) return { arrivalPressure: 'normal', waitTimeTrajectory: 'stable', metrics: {} };
    
    const latest = arrivalData[0];
    
    let arrivalPressure = 'normal';
    if (latest.averageWaitMinutes > 90) arrivalPressure = 'severe';
    else if (latest.averageWaitMinutes > 45) arrivalPressure = 'elevated';
    
    // Temporal Trend
    const waitTrend = analyzeTrend(arrivalData, d => d.averageWaitMinutes);
    const waitTimeTrajectory = getTrendState(waitTrend.delta, { rapid: 0.2, moderate: 0.1 });
    
    return {
        arrivalPressure,
        waitTimeTrajectory,
        metrics: {
            averageWaitMinutes: latest.averageWaitMinutes,
            emergencyArrivals: latest.emergencyArrivals,
            traumaCases: latest.traumaCases,
            waitTrendDelta: waitTrend.delta
        }
    };
}

function computeReadiness(occupancy, staffing, transport, respiratory, arrivals) {
    // 4. READINESS DERIVATION
    let score = 100;
    
    // Base State Penalties
    const overOcc = occupancy.metrics.overallOccupancyRate || 0;
    if (overOcc > 0.85) score -= 15;
    else if (overOcc > 0.7) score -= 5;
    
    if (occupancy.icuPressure === 'critical') score -= 10;
    if (occupancy.erCongestion === 'volatile') score -= 10;
    
    if (staffing.staffingStability === 'fragile') score -= 15;
    else if (staffing.staffingStability === 'strained') score -= 5;
    
    if (transport.ambulanceFlow === 'critical intake compression') score -= 15;
    if (arrivals.arrivalPressure === 'severe') score -= 10;
    
    const isoDemand = respiratory.metrics.isolationDemandIndex || 0;
    if (isoDemand > 0.8) score -= 15;
    else if (isoDemand > 0.5) score -= 5;
    
    // Trend/Momentum Penalties
    if (occupancy.occupancyMomentum === 'rapidly worsening') score -= 8;
    else if (occupancy.occupancyMomentum === 'improving') score += 5;
    
    if (occupancy.congestionTrajectory === 'rapidly worsening') score -= 8;
    else if (occupancy.congestionTrajectory === 'improving') score += 5;
    
    if (transport.intakeAcceleration === 'rapidly worsening') score -= 8;
    else if (transport.intakeAcceleration === 'improving') score += 5;

    if (staffing.staffingRecovery === 'rapidly worsening') score -= 8; // meaning fatigue is worsening rapidly
    else if (staffing.staffingRecovery === 'improving') score += 5;

    if (respiratory.respiratoryEscalation === 'rapidly worsening') score -= 8;
    
    // Bounds check
    score = Math.max(0, Math.min(100, score));
    
    let surgeRisk = 'Low';
    if (score < 40) surgeRisk = 'Critical';
    else if (score < 60) surgeRisk = 'High';
    else if (score < 80) surgeRisk = 'Moderate';
    
    return {
        readinessScore: Math.round(score),
        surgeRisk,
        intakeCompression: transport.ambulanceFlow,
        isolationStress: respiratory.metrics.viralPressure || 'Normal',
        staffingResilience: staffing.staffingStability
    };
}

// 3. EXPOSE A CLEAN OPERATIONAL STATE OBJECT
async function buildOperationalState() {
    const [
        bedData,
        staffingData,
        ambulanceData,
        labData,
        arrivalData
    ] = await Promise.all([
        loadDataset('bed_occupancy.json'),
        loadDataset('staffing_roster.json'),
        loadDataset('ambulance_feed.json'),
        loadDataset('lab_positivity.json'),
        loadDataset('patient_arrivals.json')
    ]);

    const occupancy = deriveOccupancyMetrics(bedData);
    const staffing = deriveStaffingMetrics(staffingData);
    const transport = deriveTransportMetrics(ambulanceData);
    const respiratory = deriveRespiratoryMetrics(labData);
    const arrivals = deriveArrivalMetrics(arrivalData);
    
    const readiness = computeReadiness(occupancy, staffing, transport, respiratory, arrivals);
    
    let escalationRisk = 'low';
    if (readiness.readinessScore < 50) escalationRisk = 'critical';
    else if (readiness.readinessScore < 75) escalationRisk = 'elevated';

    return {
        operationalState: {
            ambulanceFlow: transport.ambulanceFlow,
            icuPressure: occupancy.icuPressure,
            staffingStability: staffing.staffingStability,
            respiratoryPressure: respiratory.respiratoryPressure,
            erCongestion: occupancy.erCongestion,
            escalationRisk,
            
            // Temporal intelligence signals
            occupancyMomentum: occupancy.occupancyMomentum,
            congestionTrajectory: occupancy.congestionTrajectory,
            staffingRecovery: staffing.staffingRecovery,
            respiratoryEscalation: respiratory.respiratoryEscalation,
            intakeAcceleration: transport.intakeAcceleration
        },
        metrics: {
            occupancyRate: occupancy.metrics.overallOccupancyRate,
            averageETA: transport.metrics.averageETA,
            positivityRate: respiratory.metrics.positivityRate,
            staffingCoverage: staffing.metrics.staffingCoverage,
            waitTimeAverage: arrivals.metrics.averageWaitMinutes,
            ...occupancy.metrics,
            ...staffing.metrics,
            ...transport.metrics,
            ...respiratory.metrics,
            ...arrivals.metrics
        },
        readiness,
        telemetrySummary: {
            lastUpdated: new Date().toISOString(),
            activeDataFeeds: [
                bedData.length > 0 ? 'bed_occupancy' : null,
                staffingData.length > 0 ? 'staffing_roster' : null,
                ambulanceData.length > 0 ? 'ambulance_feed' : null,
                labData.length > 0 ? 'lab_positivity' : null,
                arrivalData.length > 0 ? 'patient_arrivals' : null
            ].filter(Boolean)
        },
        unitPressures: occupancy.unitPressures
    };
}

module.exports = {
    buildOperationalState,
    loadDataset
};
