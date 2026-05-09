/**
 * Operations API Routes
 * 
 * Endpoints for risk assessment, protocol management, alerts, and forecasts.
 * 
 * GET  /api/operations/risk                    — Current risk assessment
 * GET  /api/operations/protocols               — All protocols with state
 * POST /api/operations/protocols/:id/activate   — Activate a protocol
 * POST /api/operations/protocols/:id/deactivate — Deactivate a protocol
 * GET  /api/operations/alerts                  — All alerts
 * POST /api/operations/alerts/:id/acknowledge   — Acknowledge an alert
 * POST /api/operations/alerts/:id/resolve       — Resolve an alert
 * POST /api/operations/predict                  — Run live prediction
 * GET  /api/operations/dashboard               — Aggregated dashboard data
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { evaluateRisk, assessAndAlert } = require('../services/riskEngine');
const { evaluateProtocols, activateProtocol, deactivateProtocol, getProtocols } = require('../services/protocolEngine');
const forecastService = require('../services/forecastService');

// ── Risk Assessment ───────────────────────────────────────────────────────────

router.get('/risk', (req, res) => {
    try {
        const hospitalId = parseInt(req.query.hospitalId) || 1;
        const risk = evaluateRisk(hospitalId);
        res.json({ success: true, ...risk });
    } catch (err) {
        console.error('[Operations] Risk evaluation error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/operations/risk/assess
 * Run full risk assessment with auto-alerting and protocol evaluation.
 */
router.post('/risk/assess', (req, res) => {
    try {
        const hospitalId = parseInt(req.body.hospitalId) || 1;

        // 1. Evaluate risk
        const risk = assessAndAlert(hospitalId);

        // 2. Check protocols against risk
        const protocolResult = evaluateProtocols(hospitalId, risk);

        res.json({
            success: true,
            risk,
            protocols: protocolResult
        });
    } catch (err) {
        console.error('[Operations] Risk assess error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Protocol Management ───────────────────────────────────────────────────────

router.get('/protocols', (req, res) => {
    try {
        const hospitalId = parseInt(req.query.hospitalId) || 1;
        const protocols = getProtocols(hospitalId);
        res.json({ success: true, protocols });
    } catch (err) {
        console.error('[Operations] Protocols error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/protocols/:id/activate', (req, res) => {
    try {
        const protocolId = parseInt(req.params.id);
        const reason = req.body.reason || 'Manual activation via dashboard';
        const protocol = activateProtocol(protocolId, reason);

        if (!protocol) {
            return res.status(404).json({ success: false, error: 'Protocol not found' });
        }

        // Trigger notification if service is available
        try {
            const notificationService = require('../services/notificationService');
            notificationService.sendProtocolAlert(protocol);
        } catch (e) { /* notification service may not be configured */ }

        res.json({ success: true, protocol: { ...protocol, status: 'active' } });
    } catch (err) {
        console.error('[Operations] Protocol activate error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/protocols/:id/deactivate', (req, res) => {
    try {
        const protocolId = parseInt(req.params.id);
        const reason = req.body.reason || 'Manual deactivation via dashboard';
        const protocol = deactivateProtocol(protocolId, reason);

        if (!protocol) {
            return res.status(404).json({ success: false, error: 'Protocol not found' });
        }

        res.json({ success: true, protocol: { ...protocol, status: 'cooldown' } });
    } catch (err) {
        console.error('[Operations] Protocol deactivate error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Alerts ────────────────────────────────────────────────────────────────────

router.get('/alerts', (req, res) => {
    try {
        const hospitalId = parseInt(req.query.hospitalId) || 1;
        const status = req.query.status; // 'active', 'acknowledged', 'resolved'
        const limit = parseInt(req.query.limit) || 20;

        let sql = 'SELECT * FROM alerts WHERE hospital_id = ?';
        const params = [hospitalId];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const alerts = db.query(sql, params);
        res.json({ success: true, alerts });
    } catch (err) {
        console.error('[Operations] Alerts error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/alerts/:id/acknowledge', (req, res) => {
    try {
        const alertId = parseInt(req.params.id);
        const acknowledgedBy = req.body.acknowledgedBy || 'Dashboard User';

        db.run(
            `UPDATE alerts SET status = 'acknowledged', acknowledged_at = datetime('now'), acknowledged_by = ?
             WHERE id = ?`,
            [acknowledgedBy, alertId]
        );

        const alert = db.get('SELECT * FROM alerts WHERE id = ?', [alertId]);
        res.json({ success: true, alert });
    } catch (err) {
        console.error('[Operations] Alert acknowledge error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/alerts/:id/resolve', (req, res) => {
    try {
        const alertId = parseInt(req.params.id);

        db.run(
            `UPDATE alerts SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?`,
            [alertId]
        );

        const alert = db.get('SELECT * FROM alerts WHERE id = ?', [alertId]);
        res.json({ success: true, alert });
    } catch (err) {
        console.error('[Operations] Alert resolve error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Live Prediction ───────────────────────────────────────────────────────────

router.post('/predict', (req, res) => {
    try {
        const hospitalId = parseInt(req.body.hospitalId) || 1;
        const forecastDate = req.body.forecastDate;
        const overrides = req.body.featureOverrides || {};

        const result = forecastService.runPrediction(hospitalId, forecastDate, overrides);
        res.json(result);
    } catch (err) {
        console.error('[Operations] Prediction error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Aggregated Dashboard Data ─────────────────────────────────────────────────

router.get('/dashboard', (req, res) => {
    try {
        const hospitalId = parseInt(req.query.hospitalId) || 1;

        // Get hospital info
        const hospital = db.get('SELECT * FROM hospitals WHERE id = ?', [hospitalId]);

        // Get current risk
        const risk = evaluateRisk(hospitalId);

        // Get protocols
        const protocols = getProtocols(hospitalId);
        const activeProtocols = protocols.filter(p => p.status === 'active');

        // Get latest metrics
        const latestMetrics = db.get(
            'SELECT * FROM operational_metrics WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 1',
            [hospitalId]
        );

        // Get active alerts count
        const alertCounts = db.get(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical
             FROM alerts WHERE hospital_id = ?`,
            [hospitalId]
        );

        // Get latest forecasts
        const forecasts = forecastService.getForecasts(hospitalId, 7);

        // Get integration health
        const connectors = db.query(
            'SELECT connector_name, status, last_latency_ms, last_sync_at FROM integration_status WHERE hospital_id = ?',
            [hospitalId]
        );
        const healthyConnectors = connectors.filter(c => c.status === 'active').length;

        res.json({
            success: true,
            hospital,
            risk,
            protocols: {
                total: protocols.length,
                active: activeProtocols.length,
                list: protocols
            },
            metrics: latestMetrics,
            alerts: alertCounts,
            forecasts,
            integrations: {
                total: connectors.length,
                healthy: healthyConnectors,
                list: connectors
            }
        });
    } catch (err) {
        console.error('[Operations] Dashboard error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
