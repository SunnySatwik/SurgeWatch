/**
 * CSV Connector
 * 
 * Ingests hospital operational data from CSV files (e.g., exported from legacy systems).
 * Validates structure, normalizes fields, and stores in the database.
 */

const fs = require('fs');
const path = require('path');
const db = require('../db');
const { normalize } = require('../services/normalizationService');

/**
 * Parse a simple CSV string into an array of objects.
 * Uses the first row as header names.
 */
function parseCSV(csvString) {
    const lines = csvString.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const obj = {};
        headers.forEach((h, i) => {
            const val = values[i];
            // Auto-convert numeric strings
            if (val !== undefined && val !== '' && !isNaN(val)) {
                obj[h] = parseFloat(val);
            } else {
                obj[h] = val || null;
            }
        });
        return obj;
    });
}

/**
 * Ingest a CSV file and store normalized records as operational_metrics.
 * 
 * @param {string} filePath - Absolute path to CSV file
 * @param {number} hospitalId - Hospital ID to associate records with
 * @returns {{ success: boolean, recordsProcessed: number, warnings: string[] }}
 */
function ingestFile(filePath, hospitalId = 1) {
    const startTime = Date.now();
    const warnings = [];

    if (!fs.existsSync(filePath)) {
        return { success: false, recordsProcessed: 0, warnings: ['File not found: ' + filePath] };
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const records = parseCSV(raw);

    if (records.length === 0) {
        return { success: false, recordsProcessed: 0, warnings: ['CSV is empty or has no data rows'] };
    }

    let processed = 0;

    db.transaction(() => {
        for (const record of records) {
            const { normalized, warnings: normWarnings, dataQuality } = normalize(record);
            warnings.push(...normWarnings);

            db.run(
                `INSERT INTO operational_metrics 
                (hospital_id, total_admissions, total_discharges, er_visits, occupancy_pct, avg_wait_time_min, ambulance_arrivals, data_source, data_quality, raw_payload)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'csv', ?, ?)`,
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
    })();

    // Update integration status
    const latency = Date.now() - startTime;
    updateIntegrationStatus(hospitalId, 'CSV Import', 'csv', 'active', latency, processed);

    return { success: true, recordsProcessed: processed, warnings };
}

/**
 * Ingest CSV data from a string (for API uploads).
 */
function ingestString(csvString, hospitalId = 1) {
    const tmpPath = path.join(__dirname, '..', 'db', '_tmp_upload.csv');
    fs.writeFileSync(tmpPath, csvString, 'utf8');
    const result = ingestFile(tmpPath, hospitalId);
    try { fs.unlinkSync(tmpPath); } catch (e) { /* ignore cleanup errors */ }
    return result;
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

module.exports = { ingestFile, ingestString, parseCSV };
