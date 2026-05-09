/**
 * SurgeWatch Operations Service (Frontend)
 * 
 * API client for all operations endpoints: risk, protocols, alerts, predictions.
 */

const API_BASE = '/api/operations';
const CONNECTORS_BASE = '/api/connectors';

// ── Risk ──────────────────────────────────────────────────────────────────────

export async function fetchRisk(hospitalId = 1) {
    const res = await fetch(`${API_BASE}/risk?hospitalId=${hospitalId}`);
    if (!res.ok) throw new Error(`Risk API error: ${res.statusText}`);
    return res.json();
}

export async function runRiskAssessment(scenarioModifiers = null, hospitalId = 1) {
    const res = await fetch(`${API_BASE}/risk/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId, scenarioModifiers })
    });
    if (!res.ok) throw new Error(`Risk assess error: ${res.statusText}`);
    return res.json();
}

// ── Protocols ─────────────────────────────────────────────────────────────────

export async function fetchProtocols(hospitalId = 1) {
    const res = await fetch(`${API_BASE}/protocols?hospitalId=${hospitalId}`);
    if (!res.ok) throw new Error(`Protocols API error: ${res.statusText}`);
    return res.json();
}

export async function activateProtocol(protocolId, reason = 'Activated via dashboard') {
    const res = await fetch(`${API_BASE}/protocols/${protocolId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error(`Activate error: ${res.statusText}`);
    return res.json();
}

export async function deactivateProtocol(protocolId, reason = 'Stood down via dashboard') {
    const res = await fetch(`${API_BASE}/protocols/${protocolId}/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error(`Deactivate error: ${res.statusText}`);
    return res.json();
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export async function fetchAlerts(hospitalId = 1, status = null, limit = 20) {
    let url = `${API_BASE}/alerts?hospitalId=${hospitalId}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Alerts API error: ${res.statusText}`);
    return res.json();
}

export async function acknowledgeAlert(alertId, acknowledgedBy = 'Dashboard User') {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledgedBy })
    });
    if (!res.ok) throw new Error(`Acknowledge error: ${res.statusText}`);
    return res.json();
}

export async function resolveAlert(alertId) {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Resolve error: ${res.statusText}`);
    return res.json();
}

// ── Dashboard Aggregate ───────────────────────────────────────────────────────

export async function fetchDashboardData(hospitalId = 1) {
    const res = await fetch(`${API_BASE}/dashboard?hospitalId=${hospitalId}`);
    if (!res.ok) throw new Error(`Dashboard API error: ${res.statusText}`);
    return res.json();
}

// ── Connectors ────────────────────────────────────────────────────────────────

export async function fetchConnectorStatus(hospitalId = 1) {
    const res = await fetch(`${CONNECTORS_BASE}/status?hospitalId=${hospitalId}`);
    if (!res.ok) throw new Error(`Connector status error: ${res.statusText}`);
    return res.json();
}

export async function triggerFHIRSync(hospitalId = 1) {
    const res = await fetch(`${CONNECTORS_BASE}/ingest/fhir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId })
    });
    if (!res.ok) throw new Error(`FHIR sync error: ${res.statusText}`);
    return res.json();
}

export async function triggerWeatherSync(hospitalId = 1) {
    const res = await fetch(`${CONNECTORS_BASE}/sync/weather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId })
    });
    if (!res.ok) throw new Error(`Weather sync error: ${res.statusText}`);
    return res.json();
}

export async function fetchOperationalMetrics(hospitalId = 1) {
    const res = await fetch(`${CONNECTORS_BASE}/metrics?hospitalId=${hospitalId}`);
    if (!res.ok) throw new Error(`Metrics error: ${res.statusText}`);
    return res.json();
}
