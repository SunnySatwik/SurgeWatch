/**
 * API Connector
 * 
 * Generic REST API connector that fetches JSON from a configurable endpoint,
 * maps fields via a schema definition, normalizes them, and stores in the database.
 */

const db = require('../db');
const { normalize } = require('../services/normalizationService');

/**
 * Fetch data from a REST API endpoint and store as operational metrics.
 * 
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options (headers, auth, etc.)
 * @param {number} hospitalId - Hospital ID
 * @returns {{ success: boolean, recordsProcessed: number, warnings: string[], data: object }}
 */
async function ingestFromAPI(url, options = {}, hospitalId = 1) {
    const startTime = Date.now();
    const warnings = [];

    try {
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...(options.body ? { body: JSON.stringify(options.body) } : {})
        });

        if (!response.ok) {
            const latency = Date.now() - startTime;
            updateIntegrationStatus(hospitalId, options.connectorName || 'API Import', 'api', 'degraded', latency, 0, `HTTP ${response.status}`);
            return { success: false, recordsProcessed: 0, warnings: [`API returned ${response.status}: ${response.statusText}`], data: null };
        }

        const rawData = await response.json();
        const latency = Date.now() - startTime;

        // Handle both single object and array responses
        const records = Array.isArray(rawData) ? rawData : (rawData.data ? (Array.isArray(rawData.data) ? rawData.data : [rawData.data]) : [rawData]);

        let processed = 0;

        for (const record of records) {
            const { normalized, warnings: normWarnings, dataQuality } = normalize(record);
            warnings.push(...normWarnings);

            db.run(
                `INSERT INTO operational_metrics 
                (hospital_id, total_admissions, total_discharges, er_visits, occupancy_pct, avg_wait_time_min, ambulance_arrivals, data_source, data_quality, raw_payload)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'api', ?, ?)`,
                [
                    hospitalId,
                    normalized.totalAdmissions,
                    normalized.totalDischarges,
                    normalized.erVisits,
                    normalized.occupancyPct,
                    normalized.avgWaitTimeMin,
                    normalized.ambulanceArrivals,
                    dataQuality,
                    JSON.stringify(record)
                ]
            );
            processed++;
        }

        updateIntegrationStatus(hospitalId, options.connectorName || 'API Import', 'api', 'active', latency, processed);

        return { success: true, recordsProcessed: processed, warnings, data: rawData };
    } catch (err) {
        const latency = Date.now() - startTime;
        updateIntegrationStatus(hospitalId, options.connectorName || 'API Import', 'api', 'offline', latency, 0, err.message);
        return { success: false, recordsProcessed: 0, warnings: [err.message], data: null };
    }
}

function updateIntegrationStatus(hospitalId, connectorName, connectorType, status, latencyMs, recordsSynced, error = null) {
    const existing = db.get(
        'SELECT id FROM integration_status WHERE hospital_id = ? AND connector_name = ?',
        [hospitalId, connectorName]
    );

    if (existing) {
        db.run(
            `UPDATE integration_status 
             SET status = ?, last_sync_at = datetime('now'), last_latency_ms = ?, records_synced = records_synced + ?, 
                 last_error = ?, error_count = CASE WHEN ? IS NOT NULL THEN error_count + 1 ELSE error_count END,
                 updated_at = datetime('now')
             WHERE id = ?`,
            [status, latencyMs, recordsSynced, error, error, existing.id]
        );
    } else {
        db.run(
            `INSERT INTO integration_status (hospital_id, connector_name, connector_type, status, last_sync_at, last_latency_ms, records_synced, last_error)
             VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?)`,
            [hospitalId, connectorName, connectorType, status, latencyMs, recordsSynced, error]
        );
    }
}

module.exports = { ingestFromAPI };
