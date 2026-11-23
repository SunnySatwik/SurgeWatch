const db = require('../db');
const { evaluateRisk } = require('./riskEngine');
const forecastService = require('./forecastService');

const ALLOWED_TOOLS = new Set([
    'snapshot',
    'beds',
    'staffing',
    'alerts',
    'forecast',
    'protocols',
    'lab',
    'metrics',
    'integrations'
]);

function getHospital(hospitalId) {
    return db.get('SELECT id, name, code, district, state, total_beds, icu_beds, er_beds FROM hospitals WHERE id = ?', [hospitalId]);
}

function collectToolData(tool, hospitalId) {
    switch (tool) {
        case 'snapshot': {
            const hospital = getHospital(hospitalId);
            const risk = evaluateRisk(hospitalId);
            const latestMetrics = db.get(
                'SELECT * FROM operational_metrics WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 1',
                [hospitalId]
            );
            const activeAlerts = db.query(
                `SELECT severity, title, message, created_at FROM alerts
                 WHERE hospital_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 5`,
                [hospitalId]
            );
            return { hospital, risk, latestMetrics, activeAlerts };
        }
        case 'beds':
            return db.query(
                `SELECT department, total_beds, occupied_beds, occupancy_pct
                 FROM bed_status WHERE hospital_id = ? AND timestamp =
                 (SELECT MAX(timestamp) FROM bed_status WHERE hospital_id = ?)
                 ORDER BY department`,
                [hospitalId, hospitalId]
            );
        case 'staffing':
            return db.query(
                `SELECT department, shift, nurses_on_duty, doctors_on_duty, nurse_patient_ratio,
                        on_call_available, surge_staff_deployed, coverage_status
                 FROM staffing_status WHERE hospital_id = ? AND timestamp =
                 (SELECT MAX(timestamp) FROM staffing_status WHERE hospital_id = ?)
                 ORDER BY department`,
                [hospitalId, hospitalId]
            );
        case 'alerts':
            return db.query(
                `SELECT severity, title, message, source, status, created_at
                 FROM alerts WHERE hospital_id = ? ORDER BY created_at DESC LIMIT 10`,
                [hospitalId]
            );
        case 'forecast':
            return forecastService.getForecasts(hospitalId, 7);
        case 'protocols':
            return db.query(
                `SELECT name, code, description, status, activation_count, actions
                 FROM protocols WHERE hospital_id = ? ORDER BY status DESC, name`,
                [hospitalId]
            ).map(row => ({
                ...row,
                actions: JSON.parse(row.actions || '[]')
            }));
        case 'lab':
            return db.query(
                `SELECT test_type, timestamp, tests_conducted, tests_positive, positivity_rate, trend
                 FROM lab_signals WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 12`,
                [hospitalId]
            );
        case 'metrics':
            return db.query(
                `SELECT timestamp, total_admissions, total_discharges, er_visits, occupancy_pct,
                        avg_wait_time_min, ambulance_arrivals, data_quality
                 FROM operational_metrics WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 7`,
                [hospitalId]
            );
        case 'integrations':
            return db.query(
                `SELECT connector_name, connector_type, status, last_sync_at, last_latency_ms,
                        records_synced, error_count, last_error
                 FROM integration_status WHERE hospital_id = ? ORDER BY connector_name`,
                [hospitalId]
            );
        default:
            return null;
    }
}

function parseJson(text) {
    if (!text) return null;
    const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) {
            try {
                return JSON.parse(cleaned.slice(start, end + 1));
            } catch {
                return null;
            }
        }
        return null;
    }
}

async function callGemini(apiKey, prompt) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 900,
                    responseMimeType: 'application/json'
                }
            }),
            signal: AbortSignal.timeout(30000)
        }
    );

    const payload = await response.json();
    if (!response.ok) {
        const message = payload?.error?.message || `Gemini API returned ${response.status}`;
        const error = new Error(message);
        error.status = response.status >= 500 ? 503 : 502;
        throw error;
    }

    return payload?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
}

async function answerQuestion({ message, history = [], hospitalId = 1 }) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        const error = new Error('GEMINI_API_KEY is not configured in the backend environment');
        error.status = 503;
        throw error;
    }

    const safeHistory = Array.isArray(history)
        ? history.filter(item => item && typeof item.content === 'string')
            .slice(-10)
            .map(item => ({
                role: item.role === 'assistant' ? 'assistant' : 'user',
                content: item.content.slice(0, 1000)
            }))
        : [];

    const intentPrompt = `You route questions for a hospital operations dashboard.
Choose only tools needed to answer the latest user question.
Allowed tools: ${JSON.stringify([...ALLOWED_TOOLS])}.
Return JSON exactly as: {"tools":["snapshot"],"reason":"brief reason"}.
Use snapshot for overall status, risk, or a general summary.
Use beds, staffing, alerts, forecast, protocols, lab, metrics, or integrations for specific requests.
User question: ${message.slice(0, 1500)}
Recent conversation: ${JSON.stringify(safeHistory)}`;

    const intentText = await callGemini(apiKey, intentPrompt);
    const intent = parseJson(intentText);
    const tools = intent && Array.isArray(intent.tools)
        ? [...new Set(intent.tools.filter(tool => ALLOWED_TOOLS.has(tool)))].slice(0, 3)
        : ['snapshot'];

    const data = {};
    tools.forEach(tool => {
        data[tool] = collectToolData(tool, hospitalId);
    });

    const responsePrompt = `You are the SurgeWatch hospital operations assistant.
Answer using only the database facts in the RETRIEVED_DATA section.
Never invent, estimate, or present unavailable values as facts.
Clearly label recommendations separately from database facts.
Use concise, professional language suitable for hospital administrators.
If the data does not answer the question, say that the available records do not contain that answer.
Do not claim to be able to execute database changes. This mode is read-only.

Latest user question: ${message.slice(0, 1500)}
Conversation context: ${JSON.stringify(safeHistory)}
Retrieved data: ${JSON.stringify(data).slice(0, 18000)}

Return valid JSON with exactly these fields:
{"answer":"human-readable answer","facts":["concise factual statements"],"recommendations":["optional operational recommendations"],"toolsUsed":["tool names"],"confidence":"high|medium|low"}`;

    const answerText = await callGemini(apiKey, responsePrompt);
    const result = parseJson(answerText);

    if (!result || typeof result.answer !== 'string') {
        const error = new Error('The AI model returned an invalid response');
        error.status = 502;
        throw error;
    }

    return {
        success: true,
        answer: result.answer,
        facts: Array.isArray(result.facts) ? result.facts : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
        toolsUsed: tools,
        confidence: ['high', 'medium', 'low'].includes(result.confidence) ? result.confidence : 'medium',
        hospitalId
    };
}

module.exports = { answerQuestion, collectToolData };
