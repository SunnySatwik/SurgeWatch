-- ============================================
-- SurgeWatch Operational Intelligence Schema
-- Database: SQLite
-- ============================================

-- Hospitals (Multi-hospital ready for Phase 10)
CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,           -- e.g., 'SHIV-DH' for Shivamogga District Hospital
    district TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Karnataka',
    total_beds INTEGER NOT NULL DEFAULT 200,
    icu_beds INTEGER NOT NULL DEFAULT 20,
    er_beds INTEGER NOT NULL DEFAULT 30,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Operational Metrics (hourly snapshots of hospital state)
CREATE TABLE IF NOT EXISTS operational_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    total_admissions INTEGER NOT NULL DEFAULT 0,
    total_discharges INTEGER NOT NULL DEFAULT 0,
    er_visits INTEGER NOT NULL DEFAULT 0,
    occupancy_pct REAL NOT NULL DEFAULT 0.0 CHECK(occupancy_pct >= 0 AND occupancy_pct <= 100),
    avg_wait_time_min REAL DEFAULT NULL,
    ambulance_arrivals INTEGER DEFAULT 0,
    data_source TEXT DEFAULT 'manual',   -- 'csv', 'fhir', 'api', 'manual', 'simulated'
    data_quality TEXT DEFAULT 'good' CHECK(data_quality IN ('good', 'degraded', 'missing')),
    raw_payload TEXT DEFAULT NULL         -- original ingested data as JSON string
);
CREATE INDEX IF NOT EXISTS idx_metrics_hospital_ts ON operational_metrics(hospital_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON operational_metrics(timestamp);

-- Bed Status (real-time bed census by department)
CREATE TABLE IF NOT EXISTS bed_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    department TEXT NOT NULL,              -- 'ER', 'ICU', 'General', 'Pediatrics', 'Isolation'
    total_beds INTEGER NOT NULL,
    occupied_beds INTEGER NOT NULL,
    available_beds INTEGER GENERATED ALWAYS AS (total_beds - occupied_beds) STORED,
    occupancy_pct REAL GENERATED ALWAYS AS (CAST(occupied_beds AS REAL) / total_beds * 100) STORED,
    ventilators_in_use INTEGER DEFAULT 0,
    ventilators_total INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_beds_hospital_dept ON bed_status(hospital_id, department, timestamp);

-- Staffing Status (shift-level staffing data)
CREATE TABLE IF NOT EXISTS staffing_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    shift TEXT NOT NULL CHECK(shift IN ('morning', 'afternoon', 'night')),
    department TEXT NOT NULL,
    nurses_on_duty INTEGER NOT NULL DEFAULT 0,
    doctors_on_duty INTEGER NOT NULL DEFAULT 0,
    nurse_patient_ratio REAL DEFAULT NULL,
    on_call_available INTEGER DEFAULT 0,
    surge_staff_deployed INTEGER DEFAULT 0,
    coverage_status TEXT DEFAULT 'adequate' CHECK(coverage_status IN ('adequate', 'strained', 'critical'))
);
CREATE INDEX IF NOT EXISTS idx_staffing_hospital_ts ON staffing_status(hospital_id, timestamp);

-- Forecasts (stored ML predictions)
CREATE TABLE IF NOT EXISTS forecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    forecast_date TEXT NOT NULL,           -- the date being predicted
    generated_at TEXT NOT NULL DEFAULT (datetime('now')),
    predicted_volume INTEGER NOT NULL,
    baseline_volume INTEGER NOT NULL,
    surge_probability REAL NOT NULL,
    risk_level TEXT NOT NULL CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    confidence_pct REAL DEFAULT 90.0,
    shap_factors TEXT DEFAULT '[]',        -- JSON array of SHAP explanations
    model_version TEXT DEFAULT 'v1.0',
    feature_vector TEXT DEFAULT NULL       -- JSON of input features used
);
CREATE INDEX IF NOT EXISTS idx_forecasts_hospital_date ON forecasts(hospital_id, forecast_date);

-- Alerts (triggered operational alerts)
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    source TEXT DEFAULT 'system',          -- 'risk_engine', 'protocol_engine', 'manual', 'system'
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'acknowledged', 'resolved')),
    acknowledged_at TEXT DEFAULT NULL,
    acknowledged_by TEXT DEFAULT NULL,
    resolved_at TEXT DEFAULT NULL,
    related_protocol_id INTEGER DEFAULT NULL REFERENCES protocols(id)
);
CREATE INDEX IF NOT EXISTS idx_alerts_hospital_status ON alerts(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

-- Protocols (surge protocol definitions and activation state)
CREATE TABLE IF NOT EXISTS protocols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    name TEXT NOT NULL,
    code TEXT NOT NULL,                    -- e.g., 'DENGUE_SURGE', 'ER_OVERFLOW'
    description TEXT,
    trigger_conditions TEXT NOT NULL,      -- JSON: conditions that auto-trigger this protocol
    actions TEXT NOT NULL,                 -- JSON: recommended actions when activated
    status TEXT DEFAULT 'standby' CHECK(status IN ('standby', 'active', 'cooldown')),
    activated_at TEXT DEFAULT NULL,
    deactivated_at TEXT DEFAULT NULL,
    activation_count INTEGER DEFAULT 0,
    last_trigger_reason TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_protocols_hospital_status ON protocols(hospital_id, status);

-- Integration Status (connector health tracking)
CREATE TABLE IF NOT EXISTS integration_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    connector_name TEXT NOT NULL,          -- 'ehr_feed', 'bed_management', 'staffing_roster', etc.
    connector_type TEXT NOT NULL,          -- 'csv', 'api', 'fhir', 'weather'
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'degraded', 'offline', 'recovering')),
    last_sync_at TEXT DEFAULT NULL,
    last_latency_ms INTEGER DEFAULT 0,
    records_synced INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT DEFAULT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_integration_hospital ON integration_status(hospital_id);

-- Weather Context (cached weather data for forecast correlation)
CREATE TABLE IF NOT EXISTS weather_context (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    temperature REAL,
    humidity REAL,
    rainfall_mm REAL DEFAULT 0,
    wind_speed_kmh REAL DEFAULT 0,
    weather_code INTEGER DEFAULT 0,        -- WMO weather code
    precipitation_probability REAL DEFAULT 0,
    surge_impact_level TEXT DEFAULT 'low' CHECK(surge_impact_level IN ('low', 'moderate', 'high', 'critical')),
    source TEXT DEFAULT 'open-meteo'
);
CREATE INDEX IF NOT EXISTS idx_weather_hospital_ts ON weather_context(hospital_id, timestamp);

-- Lab Signals (lab positivity rates and disease surveillance)
CREATE TABLE IF NOT EXISTS lab_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    test_type TEXT NOT NULL,               -- 'dengue_ns1', 'covid_rtpcr', 'malaria_rdt', 'respiratory_panel'
    tests_conducted INTEGER NOT NULL DEFAULT 0,
    tests_positive INTEGER NOT NULL DEFAULT 0,
    positivity_rate REAL GENERATED ALWAYS AS (
        CASE WHEN tests_conducted > 0 
        THEN CAST(tests_positive AS REAL) / tests_conducted * 100 
        ELSE 0 END
    ) STORED,
    icd10_codes TEXT DEFAULT '[]',         -- JSON array of relevant ICD-10 codes
    trend TEXT DEFAULT 'stable' CHECK(trend IN ('declining', 'stable', 'rising', 'spike'))
);
CREATE INDEX IF NOT EXISTS idx_lab_hospital_ts ON lab_signals(hospital_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_lab_test_type ON lab_signals(test_type);
