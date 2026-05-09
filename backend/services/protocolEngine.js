/**
 * SurgeWatch Protocol Engine
 * 
 * Manages surge protocols: auto-activation based on risk conditions,
 * manual activation/deactivation, and action recommendations.
 * 
 * Each protocol has:
 * - Trigger conditions (JSON) that map to risk engine output
 * - Actions (JSON) — recommended steps when activated
 * - Status: standby | active | cooldown
 */

const db = require('../db');

/**
 * Check all protocols and auto-activate any whose trigger conditions are met.
 * 
 * @param {number} hospitalId
 * @param {object} riskAssessment - Output from riskEngine.evaluateRisk()
 * @returns {{ activated: Array, deactivated: Array }}
 */
function evaluateProtocols(hospitalId = 1, riskAssessment) {
    const protocols = db.query(
        'SELECT * FROM protocols WHERE hospital_id = ?',
        [hospitalId]
    );

    const activated = [];
    const deactivated = [];

    for (const protocol of protocols) {
        const triggers = JSON.parse(protocol.trigger_conditions);
        const shouldActivate = checkTriggerConditions(triggers, riskAssessment, hospitalId);

        if (shouldActivate && protocol.status === 'standby') {
            // Activate
            activateProtocol(protocol.id, `Auto-triggered: Risk level ${riskAssessment.level}, score ${riskAssessment.score}`);
            activated.push({
                id: protocol.id,
                name: protocol.name,
                code: protocol.code,
                reason: `Risk score ${riskAssessment.score} triggered conditions`
            });
        } else if (!shouldActivate && protocol.status === 'active') {
            // Check if conditions have been resolved long enough to deactivate
            // (In a real system, protocols would have a cooldown period)
            // For now, keep active protocols active until manually deactivated
        }
    }

    return { activated, deactivated };
}

/**
 * Check if a protocol's trigger conditions are met by current operational state.
 */
function checkTriggerConditions(triggers, riskAssessment, hospitalId) {
    let conditionsMet = 0;
    let totalConditions = 0;

    // ER Occupancy check
    if (triggers.er_occupancy_gt !== undefined) {
        totalConditions++;
        const erBed = (riskAssessment.beds || []).find(b => b.department === 'ER');
        if (erBed && erBed.occupancy > triggers.er_occupancy_gt) {
            conditionsMet++;
        }
    }

    // Lab positivity checks
    if (triggers.lab_positivity_dengue_gt !== undefined) {
        totalConditions++;
        const lab = db.get(
            `SELECT positivity_rate FROM lab_signals WHERE hospital_id = ? AND test_type = 'dengue_ns1' ORDER BY timestamp DESC LIMIT 1`,
            [hospitalId]
        );
        if (lab && lab.positivity_rate > triggers.lab_positivity_dengue_gt) {
            conditionsMet++;
        }
    }

    if (triggers.respiratory_positivity_gt !== undefined) {
        totalConditions++;
        const lab = db.get(
            `SELECT positivity_rate FROM lab_signals WHERE hospital_id = ? AND test_type = 'respiratory_panel' ORDER BY timestamp DESC LIMIT 1`,
            [hospitalId]
        );
        if (lab && lab.positivity_rate > triggers.respiratory_positivity_gt) {
            conditionsMet++;
        }
    }

    // Admissions trend
    if (triggers.admissions_trend === 'rising') {
        totalConditions++;
        const metrics = db.query(
            'SELECT total_admissions FROM operational_metrics WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 2',
            [hospitalId]
        );
        if (metrics.length >= 2 && metrics[0].total_admissions > metrics[1].total_admissions) {
            conditionsMet++;
        }
    }

    // Staffing checks
    if (triggers.nurse_patient_ratio_lt !== undefined) {
        totalConditions++;
        const staffing = db.query(
            `SELECT nurse_patient_ratio FROM staffing_status WHERE hospital_id = ? 
             AND timestamp = (SELECT MAX(timestamp) FROM staffing_status WHERE hospital_id = ?)`,
            [hospitalId, hospitalId]
        );
        const belowThreshold = staffing.filter(s => s.nurse_patient_ratio !== null && s.nurse_patient_ratio < triggers.nurse_patient_ratio_lt);
        if (belowThreshold.length > 0) conditionsMet++;
    }

    if (triggers.coverage_status === 'critical') {
        totalConditions++;
        const critical = db.get(
            `SELECT COUNT(*) as count FROM staffing_status WHERE hospital_id = ? AND coverage_status = 'critical'
             AND timestamp = (SELECT MAX(timestamp) FROM staffing_status WHERE hospital_id = ?)`,
            [hospitalId, hospitalId]
        );
        if (critical && critical.count > 0) conditionsMet++;
    }

    // Ambulance / wait time checks
    if (triggers.ambulance_arrivals_gt !== undefined) {
        totalConditions++;
        const latest = db.get(
            'SELECT ambulance_arrivals FROM operational_metrics WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 1',
            [hospitalId]
        );
        if (latest && latest.ambulance_arrivals > triggers.ambulance_arrivals_gt) conditionsMet++;
    }

    if (triggers.wait_time_gt !== undefined) {
        totalConditions++;
        const latest = db.get(
            'SELECT avg_wait_time_min FROM operational_metrics WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 1',
            [hospitalId]
        );
        if (latest && latest.avg_wait_time_min > triggers.wait_time_gt) conditionsMet++;
    }

    // Isolation occupancy
    if (triggers.isolation_occupancy_gt !== undefined) {
        totalConditions++;
        const iso = (riskAssessment.beds || []).find(b => b.department === 'Isolation');
        if (iso && iso.occupancy > triggers.isolation_occupancy_gt) conditionsMet++;
    }

    // Trauma threshold
    if (triggers.trauma_arrivals_gt !== undefined) {
        totalConditions++;
        // Use ER visits as proxy for trauma
        const latest = db.get(
            'SELECT er_visits FROM operational_metrics WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 1',
            [hospitalId]
        );
        if (latest && latest.er_visits > triggers.trauma_arrivals_gt) conditionsMet++;
    }

    // Activate if at least 50% of conditions are met (majority threshold)
    if (totalConditions === 0) return false;
    return (conditionsMet / totalConditions) >= 0.5;
}

/**
 * Manually activate a protocol.
 */
function activateProtocol(protocolId, reason = 'Manual activation') {
    db.run(
        `UPDATE protocols SET status = 'active', activated_at = datetime('now'), 
         activation_count = activation_count + 1, last_trigger_reason = ?
         WHERE id = ?`,
        [reason, protocolId]
    );

    // Get protocol details for alert
    const protocol = db.get('SELECT * FROM protocols WHERE id = ?', [protocolId]);
    if (protocol) {
        db.run(
            `INSERT INTO alerts (hospital_id, severity, title, message, source, related_protocol_id)
             VALUES (?, 'high', ?, ?, 'protocol_engine', ?)`,
            [
                protocol.hospital_id,
                `Protocol Activated: ${protocol.name}`,
                `${protocol.name} has been activated. Reason: ${reason}. ${protocol.description}`,
                protocolId
            ]
        );
    }

    return protocol;
}

/**
 * Deactivate (stand down) a protocol.
 */
function deactivateProtocol(protocolId, reason = 'Manual deactivation') {
    db.run(
        `UPDATE protocols SET status = 'cooldown', deactivated_at = datetime('now'), last_trigger_reason = ?
         WHERE id = ?`,
        [reason, protocolId]
    );

    const protocol = db.get('SELECT * FROM protocols WHERE id = ?', [protocolId]);
    if (protocol) {
        db.run(
            `INSERT INTO alerts (hospital_id, severity, title, message, source, related_protocol_id)
             VALUES (?, 'info', ?, ?, 'protocol_engine', ?)`,
            [
                protocol.hospital_id,
                `Protocol Stood Down: ${protocol.name}`,
                `${protocol.name} has been deactivated. Reason: ${reason}.`,
                protocolId
            ]
        );
    }

    // Move to standby after cooldown (immediate for demo)
    setTimeout(() => {
        db.run(
            `UPDATE protocols SET status = 'standby' WHERE id = ? AND status = 'cooldown'`,
            [protocolId]
        );
    }, 30000); // 30 second cooldown for demo

    return protocol;
}

/**
 * Get all protocols with their current state and parsed actions.
 */
function getProtocols(hospitalId = 1) {
    const protocols = db.query(
        'SELECT * FROM protocols WHERE hospital_id = ? ORDER BY status DESC, name',
        [hospitalId]
    );

    return protocols.map(p => ({
        ...p,
        trigger_conditions: JSON.parse(p.trigger_conditions),
        actions: JSON.parse(p.actions)
    }));
}

module.exports = {
    evaluateProtocols,
    activateProtocol,
    deactivateProtocol,
    getProtocols
};
