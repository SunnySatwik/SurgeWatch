/**
 * Weather Connector
 * 
 * Wraps the existing weatherService to fetch Open-Meteo data,
 * extract hospital-relevant metrics, and store them in weather_context.
 */

const db = require('../db');
const { fetchApi } = require('../utils/apiHelpers');

/**
 * Fetch weather data for a hospital's location and store in weather_context.
 * 
 * @param {number} hospitalId - Hospital ID
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {{ success: boolean, data: object }}
 */
async function syncWeather(hospitalId = 1, lat = 13.9299, lon = 75.5681) {
    // Default coords: Shivamogga, Karnataka
    const startTime = Date.now();

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,weather_code` +
            `&timezone=auto&forecast_days=1`;

        const rawData = await fetchApi(url);
        const latency = Date.now() - startTime;

        const current = rawData.current;

        // Determine surge impact based on weather conditions
        let surgeImpactLevel = 'low';
        if (current.precipitation_probability > 60 || current.weather_code >= 63) {
            surgeImpactLevel = 'critical';
        } else if (current.relative_humidity_2m > 75 && current.weather_code >= 45) {
            surgeImpactLevel = 'high';
        } else if (current.temperature_2m > 35 || current.temperature_2m < 15 || current.precipitation_probability > 30) {
            surgeImpactLevel = 'moderate';
        }

        // Store in weather_context
        db.run(
            `INSERT INTO weather_context 
            (hospital_id, temperature, humidity, rainfall_mm, wind_speed_kmh, weather_code, precipitation_probability, surge_impact_level, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open-meteo')`,
            [
                hospitalId,
                current.temperature_2m,
                current.relative_humidity_2m,
                0, // Open-Meteo current doesn't include rainfall_mm directly
                current.wind_speed_10m,
                current.weather_code,
                current.precipitation_probability,
                surgeImpactLevel
            ]
        );

        // Update integration status
        updateIntegrationStatus(hospitalId, 'Weather Intelligence', 'weather', 'active', latency, 1);

        return {
            success: true,
            data: {
                temperature: current.temperature_2m,
                humidity: current.relative_humidity_2m,
                weatherCode: current.weather_code,
                precipProb: current.precipitation_probability,
                windSpeed: current.wind_speed_10m,
                surgeImpactLevel
            }
        };
    } catch (err) {
        const latency = Date.now() - startTime;
        updateIntegrationStatus(hospitalId, 'Weather Intelligence', 'weather', 'degraded', latency, 0, err.message);
        return { success: false, data: null, error: err.message };
    }
}

function updateIntegrationStatus(hospitalId, connectorName, connectorType, status, latencyMs, recordsSynced, error = null) {
    const existing = db.get(
        'SELECT id FROM integration_status WHERE hospital_id = ? AND connector_name = ?',
        [hospitalId, connectorName]
    );

    if (existing) {
        db.run(
            `UPDATE integration_status SET status = ?, last_sync_at = datetime('now'), last_latency_ms = ?, records_synced = records_synced + ?,
             last_error = ?, updated_at = datetime('now') WHERE id = ?`,
            [status, latencyMs, recordsSynced, error, existing.id]
        );
    } else {
        db.run(
            `INSERT INTO integration_status (hospital_id, connector_name, connector_type, status, last_sync_at, last_latency_ms, records_synced, last_error)
             VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?)`,
            [hospitalId, connectorName, connectorType, status, latencyMs, recordsSynced, error]
        );
    }
}

module.exports = { syncWeather };
