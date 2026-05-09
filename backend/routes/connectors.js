/**
 * Connectors API Routes
 * 
 * Endpoints to trigger data ingestion and check connector health.
 * 
 * POST /api/connectors/ingest/csv     — Upload CSV data
 * POST /api/connectors/ingest/fhir    — Trigger simulated FHIR sync
 * POST /api/connectors/sync/weather   — Sync weather data
 * GET  /api/connectors/status         — Get all connector health statuses
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const csvConnector = require('../connectors/csvConnector');
const fhirConnector = require('../connectors/simulatedFHIRConnector');
const weatherConnector = require('../connectors/weatherConnector');

/**
 * POST /api/connectors/ingest/csv
 * Body: { csvData: "header1,header2\nval1,val2\n...", hospitalId: 1 }
 */
router.post('/ingest/csv', (req, res) => {
    try {
        const { csvData, hospitalId } = req.body;

        if (!csvData) {
            return res.status(400).json({ success: false, error: 'csvData is required' });
        }

        const result = csvConnector.ingestString(csvData, hospitalId || 1);
        res.json({ success: result.success, ...result });
    } catch (err) {
        console.error('[Connector] CSV ingest error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/connectors/ingest/fhir
 * Body: { hospitalId: 1 } (optional)
 * Triggers a simulated FHIR sync cycle.
 */
router.post('/ingest/fhir', (req, res) => {
    try {
        const hospitalId = req.body.hospitalId || 1;
        const result = fhirConnector.simulateSync(hospitalId);
        res.json({ success: result.success, ...result });
    } catch (err) {
        console.error('[Connector] FHIR ingest error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/connectors/sync/weather
 * Body: { hospitalId: 1, lat: 13.93, lon: 75.57 } (optional)
 */
router.post('/sync/weather', async (req, res) => {
    try {
        const { hospitalId, lat, lon } = req.body;
        const result = await weatherConnector.syncWeather(hospitalId || 1, lat, lon);
        res.json({ success: result.success, ...result });
    } catch (err) {
        console.error('[Connector] Weather sync error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/connectors/status
 * Returns health status of all connectors for a hospital.
 */
router.get('/status', (req, res) => {
    try {
        const hospitalId = req.query.hospitalId || 1;
        const connectors = db.query(
            'SELECT * FROM integration_status WHERE hospital_id = ? ORDER BY connector_name',
            [hospitalId]
        );

        // Enrich with computed fields
        const enriched = connectors.map(c => ({
            ...c,
            isHealthy: c.status === 'active',
            timeSinceSync: c.last_sync_at ? timeSince(c.last_sync_at) : 'Never',
        }));

        res.json({ success: true, connectors: enriched });
    } catch (err) {
        console.error('[Connector] Status error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/connectors/metrics
 * Returns latest operational metrics.
 */
router.get('/metrics', (req, res) => {
    try {
        const hospitalId = req.query.hospitalId || 1;
        const limit = parseInt(req.query.limit) || 10;

        const metrics = db.query(
            'SELECT * FROM operational_metrics WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT ?',
            [hospitalId, limit]
        );

        const beds = db.query(
            `SELECT * FROM bed_status WHERE hospital_id = ? AND timestamp = (
                SELECT MAX(timestamp) FROM bed_status WHERE hospital_id = ?
            )`,
            [hospitalId, hospitalId]
        );

        const staffing = db.query(
            `SELECT * FROM staffing_status WHERE hospital_id = ? AND timestamp = (
                SELECT MAX(timestamp) FROM staffing_status WHERE hospital_id = ?
            )`,
            [hospitalId, hospitalId]
        );

        res.json({ success: true, metrics, beds, staffing });
    } catch (err) {
        console.error('[Connector] Metrics error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

function timeSince(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
}

module.exports = router;
