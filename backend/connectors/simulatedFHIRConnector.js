/**
 * Simulated FHIR Connector
 * 
 * Generates realistic FHIR-like Patient/Encounter bundles and ingests them
 * into the operational database. This is NOT a real FHIR implementation —
 * it's a realistic architectural simulation for hackathon purposes.
 * 
 * In production, this would connect to a hospital's FHIR server via:
 *   GET /fhir/Encounter?status=in-progress
 *   GET /fhir/Patient?_summary=count
 */

const db = require('../db');

// ─── Simulated FHIR Data Generators ───────────────────────────────────────────

const DEPARTMENTS = ['ER', 'ICU', 'General', 'Pediatrics', 'Isolation'];
const ENCOUNTER_CLASSES = ['emergency', 'inpatient', 'observation'];
const CONDITIONS = [
    { code: 'A90', display: 'Dengue fever' },
    { code: 'J18.9', display: 'Pneumonia, unspecified' },
    { code: 'S72.0', display: 'Fracture of neck of femur' },
    { code: 'I21', display: 'Acute myocardial infarction' },
    { code: 'K35', display: 'Acute appendicitis' },
    { code: 'J06.9', display: 'Upper respiratory infection' },
    { code: 'B50', display: 'Plasmodium falciparum malaria' },
    { code: 'E11', display: 'Type 2 diabetes mellitus' },
    { code: 'N39.0', display: 'Urinary tract infection' },
    { code: 'J45', display: 'Asthma' },
];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a simulated FHIR Bundle with encounter and patient data.
 * Produces a realistic snapshot of hospital activity.
 */
function generateFHIRBundle(hospitalId = 1) {
    const now = new Date().toISOString();
    const encounterCount = randomInt(35, 70);

    const entries = [];

    for (let i = 0; i < encounterCount; i++) {
        const condition = randomChoice(CONDITIONS);
        const dept = randomChoice(DEPARTMENTS);
        const encounterClass = dept === 'ER' ? 'emergency' : randomChoice(ENCOUNTER_CLASSES);

        entries.push({
            resource: {
                resourceType: 'Encounter',
                id: `enc-${Date.now()}-${i}`,
                status: Math.random() > 0.15 ? 'in-progress' : 'finished',
                class: { code: encounterClass },
                serviceProvider: { display: dept },
                period: {
                    start: new Date(Date.now() - randomInt(1, 72) * 3600000).toISOString()
                },
                diagnosis: [{
                    condition: {
                        coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: condition.code, display: condition.display }]
                    }
                }],
                participant: [{
                    individual: {
                        display: `Dr. ${['Sharma', 'Reddy', 'Kumar', 'Gowda', 'Rao', 'Naik'][randomInt(0, 5)]}`
                    }
                }]
            }
        });
    }

    return {
        resourceType: 'Bundle',
        type: 'searchset',
        timestamp: now,
        total: entries.length,
        entry: entries
    };
}

/**
 * Process a FHIR bundle and extract operational metrics.
 * Normalizes the FHIR structure into our internal format and stores it.
 * 
 * @param {object} bundle - FHIR Bundle resource
 * @param {number} hospitalId - Hospital ID
 * @returns {{ success: boolean, recordsProcessed: number, metrics: object }}
 */
function processFHIRBundle(bundle, hospitalId = 1) {
    const startTime = Date.now();

    if (!bundle || bundle.resourceType !== 'Bundle') {
        return { success: false, recordsProcessed: 0, metrics: null };
    }

    const encounters = (bundle.entry || []).map(e => e.resource).filter(r => r.resourceType === 'Encounter');

    // Derive operational metrics from encounters
    const activeEncounters = encounters.filter(e => e.status === 'in-progress');
    const erEncounters = activeEncounters.filter(e => e.class?.code === 'emergency');
    const finishedEncounters = encounters.filter(e => e.status === 'finished');

    // Count by department
    const deptCounts = {};
    for (const enc of activeEncounters) {
        const dept = enc.serviceProvider?.display || 'General';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    }

    const hospital = db.get('SELECT * FROM hospitals WHERE id = ?', [hospitalId]);
    const totalBeds = hospital?.total_beds || 220;
    const occupancyPct = Math.min(100, (activeEncounters.length / totalBeds) * 100);

    const metrics = {
        totalAdmissions: activeEncounters.length,
        totalDischarges: finishedEncounters.length,
        erVisits: erEncounters.length,
        occupancyPct: Math.round(occupancyPct * 10) / 10,
        avgWaitTimeMin: randomInt(15, 45),
        ambulanceArrivals: randomInt(3, 12),
        departmentBreakdown: deptCounts
    };

    // Store operational metrics
    db.run(
        `INSERT INTO operational_metrics 
        (hospital_id, total_admissions, total_discharges, er_visits, occupancy_pct, avg_wait_time_min, ambulance_arrivals, data_source, data_quality, raw_payload)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'fhir', 'good', ?)`,
        [hospitalId, metrics.totalAdmissions, metrics.totalDischarges, metrics.erVisits, metrics.occupancyPct, metrics.avgWaitTimeMin, metrics.ambulanceArrivals, JSON.stringify({ bundleTotal: bundle.total, timestamp: bundle.timestamp })]
    );

    // Update bed status per department
    const bedConfigs = {
        'ER': { total: hospital?.er_beds || 35 },
        'ICU': { total: hospital?.icu_beds || 24 },
        'General': { total: 120 },
        'Pediatrics': { total: 25 },
        'Isolation': { total: 16 }
    };

    for (const [dept, config] of Object.entries(bedConfigs)) {
        const occupied = Math.min(config.total, deptCounts[dept] || randomInt(Math.floor(config.total * 0.5), config.total));
        db.run(
            `INSERT INTO bed_status (hospital_id, department, total_beds, occupied_beds) VALUES (?, ?, ?, ?)`,
            [hospitalId, dept, config.total, occupied]
        );
    }

    const latency = Date.now() - startTime;
    updateIntegrationStatus(hospitalId, 'EHR Feed', 'fhir', 'active', latency, encounters.length);

    return { success: true, recordsProcessed: encounters.length, metrics };
}

/**
 * Simulate a full FHIR sync cycle: generate + process.
 */
function simulateSync(hospitalId = 1) {
    const bundle = generateFHIRBundle(hospitalId);
    return processFHIRBundle(bundle, hospitalId);
}

function updateIntegrationStatus(hospitalId, connectorName, connectorType, status, latencyMs, recordsSynced) {
    const existing = db.get(
        'SELECT id FROM integration_status WHERE hospital_id = ? AND connector_name = ?',
        [hospitalId, connectorName]
    );

    if (existing) {
        db.run(
            `UPDATE integration_status SET status = ?, last_sync_at = datetime('now'), last_latency_ms = ?, records_synced = records_synced + ?, updated_at = datetime('now')
             WHERE id = ?`,
            [status, latencyMs, recordsSynced, existing.id]
        );
    } else {
        db.run(
            `INSERT INTO integration_status (hospital_id, connector_name, connector_type, status, last_sync_at, last_latency_ms, records_synced)
             VALUES (?, ?, ?, ?, datetime('now'), ?, ?)`,
            [hospitalId, connectorName, connectorType, status, latencyMs, recordsSynced]
        );
    }
}

module.exports = { generateFHIRBundle, processFHIRBundle, simulateSync };
