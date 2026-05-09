/**
 * SurgeWatch Live Forecast Service
 * 
 * Orchestrates live prediction by:
 * 1. Reading latest operational metrics from the database
 * 2. Constructing a feature vector matching the new ML classification model's input
 * 3. Calling the Python predict.py script
 * 4. Storing predictions in the forecasts table
 * 5. Returning predictions to the dashboard
 */

const { execSync } = require('child_process');
const path = require('path');
const db = require('../db');

const ML_DIR = path.join(__dirname, '..', '..', 'ml');
const PREDICT_SCRIPT = path.join(ML_DIR, 'predict.py');

/**
 * Build a feature vector from the latest operational state.
 * Maps database values to the exact features the new ML model expects.
 */
function buildFeatureVector(hospitalId = 1, overrides = {}) {
    // Get latest and historical metrics
    const metrics = db.query(
        'SELECT * FROM operational_metrics WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 8',
        [hospitalId]
    );
    
    const weather = db.query(
        'SELECT * FROM weather_context WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 4',
        [hospitalId]
    );

    const latestLab = db.get(
        `SELECT * FROM lab_signals WHERE hospital_id = ? AND test_type = 'respiratory_panel' ORDER BY timestamp DESC LIMIT 1`,
        [hospitalId]
    );

    // Current date info
    const now = new Date();
    const dayOfWeek = now.getDay();
    const month = now.getMonth() + 1;
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) ? 1 : 0;
    const mondayAdjacent = (dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 5) ? 1 : 0;
    
    // ISO week of year calculation
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekOfYear = Math.ceil((((d - yearStart) / 86400000) + 1)/7);

    const quarter = Math.floor((month + 2) / 3);
    const fluSeason = [11, 12, 1, 2].includes(month) ? 1 : 0;
    const monsoonSeason = [6, 7, 8, 9].includes(month) ? 1 : 0;

    // Latest states
    const latestM = metrics[0] || {};
    const prevM = metrics[1] || {};
    const latestW = weather[0] || {};
    const prevW = weather[1] || {};

    // Patient lag & rolling averages
    const baselinePatients = 110;
    const patientsPrevDay = prevM.total_admissions || baselinePatients;
    
    const metrics3d = metrics.slice(1, 4);
    const metrics7d = metrics.slice(1, 8);
    
    const avg = (arr) => arr.length ? arr.reduce((sum, m) => sum + (m.total_admissions || baselinePatients), 0) / arr.length : baselinePatients;
    const patients3dayAvg = avg(metrics3d);
    const patients7dayAvg = avg(metrics7d);
    
    const patientGrowthRate = patients7dayAvg > 0 ? (patientsPrevDay - patients7dayAvg) / patients7dayAvg : 0;
    
    // Rolling std
    const std = (arr) => {
        if(arr.length < 2) return 0;
        const m = avg(arr);
        return Math.sqrt(arr.reduce((sq, val) => sq + Math.pow((val.total_admissions || baselinePatients) - m, 2), 0) / (arr.length - 1));
    };
    const rollingStdPatients = std(metrics7d);

    // Weather rolling
    const rainfallPrevDay = prevW.rainfall_mm || 0;
    const cumRainfall3day = weather.slice(0,3).reduce((sum, w) => sum + (w.rainfall_mm || 0), 0);
    const humidityDrop = prevW.humidity && latestW.humidity && (prevW.humidity - latestW.humidity > 15) ? 1 : 0;
    const oldW = weather[3] || {};
    const humidityTrend = (latestW.humidity || 65) - (oldW.humidity || 65);

    // Operational proxies
    const estimatedBedOccupancy = Math.min(100, Math.max(40, (patients3dayAvg / 150) * 100));
    const emergencyLoadIndex = patientGrowthRate * isWeekend * 10;
    const staffPressureIndex = (estimatedBedOccupancy / 100) * (1 + isWeekend) * (1 + rollingStdPatients / 20);

    const features = {
        day_of_week: dayOfWeek,
        month: month,
        is_weekend: isWeekend,
        week_of_year: weekOfYear,
        quarter: quarter,
        flu_season: fluSeason,
        monsoon_season: monsoonSeason,
        monday_adjacent: mondayAdjacent,
        temperature: latestW.temperature || 28,
        humidity: latestW.humidity || 65,
        rainfall: latestW.rainfall_mm || 0,
        humidity_drop: humidityDrop,
        festival: 0,
        days_until_festival: 30,
        respiratory_alert: latestLab && latestLab.positivity_rate > 15 ? 1 : 0,
        patients_prev_day: patientsPrevDay,
        patients_3day_avg: patients3dayAvg,
        patients_7day_avg: patients7dayAvg,
        patient_growth_rate: patientGrowthRate,
        rolling_std_patients: rollingStdPatients,
        rainfall_prev_day: rainfallPrevDay,
        cumulative_rainfall_3day: cumRainfall3day,
        humidity_trend: humidityTrend,
        estimated_bed_occupancy: estimatedBedOccupancy,
        emergency_load_index: emergencyLoadIndex,
        staff_pressure_index: staffPressureIndex,
        ...overrides
    };

    return features;
}

/**
 * Run a live prediction using the Python ML model.
 */
function runPrediction(hospitalId = 1, forecastDate = null, featureOverrides = {}) {
    const features = buildFeatureVector(hospitalId, featureOverrides);

    if (!forecastDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        forecastDate = tomorrow.toISOString().split('T')[0];
    }

    try {
        const featuresJson = JSON.stringify(features);
        const result = execSync(
            `python "${PREDICT_SCRIPT}" --features "${featuresJson.replace(/"/g, '\\"')}"`,
            { cwd: ML_DIR, timeout: 15000, encoding: 'utf8' }
        );

        const prediction = JSON.parse(result.trim());

        if (prediction.error) {
            return { success: false, error: prediction.error };
        }
        
        // Estimate predicted volume based on risk level for backward compatibility
        const baseline = 110;
        let predictedVolume = baseline;
        if(prediction.risk_level === 'MEDIUM') predictedVolume = Math.round(baseline * 1.2);
        if(prediction.risk_level === 'HIGH') predictedVolume = Math.round(baseline * 1.5);
        if(prediction.risk_level === 'CRITICAL') predictedVolume = Math.round(baseline * 1.8);

        // Store prediction in database
        db.run(
            `INSERT INTO forecasts (hospital_id, forecast_date, predicted_volume, baseline_volume, surge_probability, risk_level, confidence_pct, feature_vector, model_version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'v2.0-classification')`,
            [
                hospitalId,
                forecastDate,
                predictedVolume,
                baseline,
                prediction.surge_probability,
                prediction.risk_level,
                prediction.confidence * 100, // percentage
                JSON.stringify(features)
            ]
        );

        return {
            success: true,
            prediction: {
                ...prediction,
                predicted_volume: predictedVolume,
                baseline_volume: baseline,
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
    return null;
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
