/**
 * SurgeWatch Live Forecast Service
 * 
 * Orchestrates live prediction by:
 * 1. Reading latest operational metrics from the database
 * 2. Constructing a feature vector matching the ML model's input
 * 3. Calling the Python predict.py script
 * 4. Storing predictions in the forecasts table
 * 5. Returning predictions to the dashboard
 * 
 * IMPORTANT: This does NOT retrain the model. It uses the trained model as-is.
 */

const { execSync } = require('child_process');
const path = require('path');
const db = require('../db');

const ML_DIR = path.join(__dirname, '..', '..', 'ml');
const PREDICT_SCRIPT = path.join(ML_DIR, 'predict.py');

/**
 * Build a feature vector from the latest operational state.
 * Maps database values to the exact features the XGBoost model expects.
 * 
 * @param {number} hospitalId
 * @param {object} overrides - Optional manual overrides for features
 * @returns {object} Feature vector
 */
function buildFeatureVector(hospitalId = 1, overrides = {}) {
    // Get latest operational metrics
    const latestMetrics = db.get(
        'SELECT * FROM operational_metrics WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 1',
        [hospitalId]
    );

    // Get latest weather
    const latestWeather = db.get(
        'SELECT * FROM weather_context WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 1',
        [hospitalId]
    );

    // Get previous weather for delta calculation
    const prevWeather = db.get(
        'SELECT * FROM weather_context WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 1 OFFSET 1',
        [hospitalId]
    );

    // Get latest lab signals for respiratory alert
    const latestLab = db.get(
        `SELECT * FROM lab_signals WHERE hospital_id = ? AND test_type = 'respiratory_panel' ORDER BY timestamp DESC LIMIT 1`,
        [hospitalId]
    );

    // Get rolling average (last 7 metrics)
    const rollingMetrics = db.query(
        'SELECT total_admissions FROM operational_metrics WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 7',
        [hospitalId]
    );
    const rollingAvg = rollingMetrics.length > 0
        ? rollingMetrics.reduce((sum, m) => sum + m.total_admissions, 0) / rollingMetrics.length
        : 110;

    // Current date info
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sunday
    const month = now.getMonth() + 1;
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) ? 1 : 0;
    const mondayAdjacent = (dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 5) ? 1 : 0;

    // Seasonal index (monsoon June-Sept = high, winter Nov-Feb = moderate)
    let seasonalIndex = 0.3;
    if (month >= 6 && month <= 9) seasonalIndex = 0.8;
    else if (month >= 11 || month <= 2) seasonalIndex = 0.6;

    // Humidity delta
    const humidityDelta = prevWeather && latestWeather
        ? Math.abs((latestWeather.humidity || 65) - (prevWeather.humidity || 65))
        : 0;

    // Humidity drop (>15% decrease)
    const humidityDrop = prevWeather && latestWeather
        ? ((prevWeather.humidity || 65) - (latestWeather.humidity || 65) > 15 ? 1 : 0)
        : 0;

    // Respiratory alert from lab data
    const respiratoryAlert = latestLab && latestLab.positivity_rate > 15 ? 1 : 0;

    // Festival detection (simplified — check if any recent festival flags exist)
    // In production this would check a festival calendar
    const festival = 0;
    const daysUntilFestival = 30;

    const features = {
        humidity: latestWeather?.humidity || 65,
        temperature: latestWeather?.temperature || 28,
        rainfall: latestWeather?.rainfall_mm || 0,
        festival: festival,
        respiratory_alert: respiratoryAlert,
        baseline_patients: latestMetrics?.total_admissions || 110,
        day_of_week: dayOfWeek,
        month: month,
        is_weekend: isWeekend,
        humidity_drop: humidityDrop,
        days_until_festival: daysUntilFestival,
        rolling_patient_average: Math.round(rollingAvg),
        humidity_delta: Math.round(humidityDelta * 10) / 10,
        rainfall_intensity: (latestWeather?.rainfall_mm || 0) > 5 ? 1 : 0,
        monday_adjacent: mondayAdjacent,
        seasonal_index: seasonalIndex,
        ...overrides
    };

    return features;
}

/**
 * Run a live prediction using the Python ML model.
 * 
 * @param {number} hospitalId
 * @param {string} forecastDate - The date being predicted (ISO format)
 * @param {object} featureOverrides - Optional overrides
 * @returns {{ success: boolean, prediction: object }}
 */
function runPrediction(hospitalId = 1, forecastDate = null, featureOverrides = {}) {
    const features = buildFeatureVector(hospitalId, featureOverrides);

    if (!forecastDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        forecastDate = tomorrow.toISOString().split('T')[0];
    }

    try {
        // Call Python predict.py
        const featuresJson = JSON.stringify(features);
        const result = execSync(
            `python "${PREDICT_SCRIPT}" --features "${featuresJson.replace(/"/g, '\\"')}"`,
            { cwd: ML_DIR, timeout: 15000, encoding: 'utf8' }
        );

        const prediction = JSON.parse(result.trim());

        if (prediction.error) {
            return { success: false, error: prediction.error };
        }

        // Store prediction in database
        db.run(
            `INSERT INTO forecasts (hospital_id, forecast_date, predicted_volume, baseline_volume, surge_probability, risk_level, confidence_pct, feature_vector, model_version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'v1.0-live')`,
            [
                hospitalId,
                forecastDate,
                prediction.predicted_volume,
                prediction.baseline_volume,
                prediction.surge_probability,
                prediction.risk_level,
                90, // Default confidence for live predictions
                JSON.stringify(features)
            ]
        );

        return {
            success: true,
            prediction: {
                ...prediction,
                forecast_date: forecastDate,
                features_used: features,
                generated_at: new Date().toISOString()
            }
        };
    } catch (err) {
        console.error('[ForecastService] Prediction failed:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Get the latest stored forecasts from the database.
 * Falls back to forecast_output.json if database is empty.
 * 
 * @param {number} hospitalId
 * @param {number} days - Number of forecast days to return
 * @returns {Array} Forecast data
 */
function getForecasts(hospitalId = 1, days = 7) {
    const forecasts = db.query(
        `SELECT * FROM forecasts WHERE hospital_id = ? ORDER BY forecast_date DESC LIMIT ?`,
        [hospitalId, days]
    );

    if (forecasts.length > 0) {
        return forecasts.map(f => ({
            ...f,
            shap_factors: JSON.parse(f.shap_factors || '[]'),
            feature_vector: f.feature_vector ? JSON.parse(f.feature_vector) : null
        }));
    }

    // Fallback: read from forecast_output.json
    return null; // Let the route handler fall back to file-based reading
}

/**
 * Get the latest single forecast for dashboard display.
 */
function getLatestForecast(hospitalId = 1) {
    const forecast = db.get(
        `SELECT * FROM forecasts WHERE hospital_id = ? ORDER BY generated_at DESC LIMIT 1`,
        [hospitalId]
    );

    if (forecast) {
        return {
            ...forecast,
            shap_factors: JSON.parse(forecast.shap_factors || '[]'),
            feature_vector: forecast.feature_vector ? JSON.parse(forecast.feature_vector) : null
        };
    }

    return null;
}

module.exports = {
    buildFeatureVector,
    runPrediction,
    getForecasts,
    getLatestForecast
};
