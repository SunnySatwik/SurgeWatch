-- ============================================
-- SurgeWatch Seed Data
-- Realistic operational data for Shivamogga District Hospital
-- ============================================

-- Hospital
INSERT INTO hospitals (name, code, district, state, total_beds, icu_beds, er_beds)
VALUES ('Shivamogga District Hospital', 'SHIV-DH', 'Shivamogga', 'Karnataka', 220, 24, 35);

-- Protocols (pre-defined surge protocols)
INSERT INTO protocols (hospital_id, name, code, description, trigger_conditions, actions, status) VALUES
(1, 'Dengue Surge Protocol', 'DENGUE_SURGE',
 'Activated during dengue season when lab positivity exceeds 15% and admissions spike.',
 '{"lab_positivity_dengue_gt": 15, "admissions_trend": "rising", "season": "monsoon"}',
 '["Deploy additional nursing staff to isolation wards", "Pre-stock NS/IV fluid supplies", "Activate platelet monitoring protocol", "Notify blood bank for standby"]',
 'standby'),

(1, 'Emergency Overflow Protocol', 'ER_OVERFLOW',
 'Triggered when ER occupancy exceeds 90% and ambulance arrivals are above normal.',
 '{"er_occupancy_gt": 90, "ambulance_arrivals_gt": 8, "wait_time_gt": 45}',
 '["Open overflow triage in outpatient area", "Redirect stable patients to General Ward", "Call in off-duty ER physicians", "Activate ambulance diversion for non-critical"]',
 'standby'),

(1, 'Staffing Escalation Protocol', 'STAFF_ESCALATION',
 'Activated when nurse-to-patient ratios fall below safe thresholds across departments.',
 '{"nurse_patient_ratio_lt": 0.2, "coverage_status": "critical", "departments_affected_gt": 2}',
 '["Trigger on-call nurse deployment", "Request agency staffing for next 48h", "Redistribute non-critical patients", "Notify HR for emergency hiring"]',
 'standby'),

(1, 'Respiratory Isolation Protocol', 'RESP_ISOLATION',
 'Activated during viral respiratory surges when isolation capacity is strained.',
 '{"respiratory_positivity_gt": 18, "isolation_occupancy_gt": 80, "trend": "rising"}',
 '["Convert Level-2 wards to negative pressure", "Deploy respiratory PPE stocks", "Halt elective surgical admissions", "Activate HL7 isolation census sync"]',
 'standby'),

(1, 'Mass Casualty Incident Protocol', 'MCI_RESPONSE',
 'Triggered during mass casualty events or major regional incidents.',
 '{"trauma_arrivals_gt": 15, "er_occupancy_gt": 95, "ambulance_wave": true}',
 '["Activate all surgical bays", "Deploy trauma teams to ER", "Notify regional blood bank", "Open secondary triage tent", "Coordinate with District Emergency Operations Center"]',
 'standby');

-- Integration Status (connectors)
INSERT INTO integration_status (hospital_id, connector_name, connector_type, status, last_sync_at, last_latency_ms, records_synced) VALUES
(1, 'EHR Feed', 'fhir', 'active', datetime('now', '-5 minutes'), 12, 1847),
(1, 'Bed Management', 'api', 'active', datetime('now', '-2 minutes'), 8, 220),
(1, 'Ambulance Telemetry', 'api', 'degraded', datetime('now', '-15 minutes'), 45, 34),
(1, 'Weather Intelligence', 'weather', 'active', datetime('now', '-10 minutes'), 110, 24),
(1, 'Staffing Roster', 'csv', 'active', datetime('now', '-8 minutes'), 15, 156),
(1, 'Lab Positivity Feed', 'api', 'active', datetime('now', '-3 minutes'), 24, 312),
(1, 'Pharmacy Inventory', 'api', 'active', datetime('now', '-12 minutes'), 32, 89),
(1, 'Regional Public Health', 'api', 'active', datetime('now', '-20 minutes'), 18, 45);

-- Operational Metrics (last 7 days of hourly snapshots — 1 per day for seed brevity)
INSERT INTO operational_metrics (hospital_id, timestamp, total_admissions, total_discharges, er_visits, occupancy_pct, avg_wait_time_min, ambulance_arrivals, data_source) VALUES
(1, datetime('now', '-6 days'), 42, 38, 67, 72.3, 22, 6, 'simulated'),
(1, datetime('now', '-5 days'), 45, 40, 71, 74.1, 25, 7, 'simulated'),
(1, datetime('now', '-4 days'), 51, 35, 82, 78.5, 31, 9, 'simulated'),
(1, datetime('now', '-3 days'), 48, 44, 75, 76.8, 28, 8, 'simulated'),
(1, datetime('now', '-2 days'), 55, 42, 88, 82.1, 35, 11, 'simulated'),
(1, datetime('now', '-1 days'), 58, 45, 91, 84.6, 38, 12, 'simulated'),
(1, datetime('now'),            52, 48, 79, 80.2, 30, 9, 'simulated');

-- Bed Status (current snapshot)
INSERT INTO bed_status (hospital_id, timestamp, department, total_beds, occupied_beds, ventilators_in_use, ventilators_total) VALUES
(1, datetime('now'), 'ER', 35, 28, 0, 0),
(1, datetime('now'), 'ICU', 24, 19, 8, 12),
(1, datetime('now'), 'General', 120, 94, 0, 0),
(1, datetime('now'), 'Pediatrics', 25, 16, 1, 3),
(1, datetime('now'), 'Isolation', 16, 11, 2, 4);

-- Staffing Status (current shift)
INSERT INTO staffing_status (hospital_id, timestamp, shift, department, nurses_on_duty, doctors_on_duty, nurse_patient_ratio, on_call_available, coverage_status) VALUES
(1, datetime('now'), 'morning', 'ER', 8, 3, 0.29, 4, 'adequate'),
(1, datetime('now'), 'morning', 'ICU', 6, 2, 0.32, 2, 'adequate'),
(1, datetime('now'), 'morning', 'General', 12, 4, 0.13, 5, 'strained'),
(1, datetime('now'), 'morning', 'Pediatrics', 4, 2, 0.25, 2, 'adequate'),
(1, datetime('now'), 'morning', 'Isolation', 4, 1, 0.36, 1, 'adequate');

-- Weather Context (recent readings)
INSERT INTO weather_context (hospital_id, timestamp, temperature, humidity, rainfall_mm, wind_speed_kmh, weather_code, precipitation_probability, surge_impact_level) VALUES
(1, datetime('now', '-2 hours'), 28.5, 72, 0, 12.3, 2, 10, 'low'),
(1, datetime('now', '-1 hours'), 27.8, 75, 2.1, 14.1, 51, 35, 'moderate'),
(1, datetime('now'),             26.4, 81, 5.8, 16.7, 61, 55, 'moderate');

-- Lab Signals (recent surveillance data)
INSERT INTO lab_signals (hospital_id, timestamp, test_type, tests_conducted, tests_positive, icd10_codes, trend) VALUES
(1, datetime('now', '-1 days'), 'dengue_ns1', 45, 6, '["A90", "A91"]', 'stable'),
(1, datetime('now', '-1 days'), 'respiratory_panel', 38, 5, '["J06.9", "J18.9", "J20.9"]', 'rising'),
(1, datetime('now', '-1 days'), 'malaria_rdt', 22, 2, '["B50", "B51"]', 'stable'),
(1, datetime('now'), 'dengue_ns1', 52, 9, '["A90", "A91"]', 'rising'),
(1, datetime('now'), 'respiratory_panel', 41, 8, '["J06.9", "J18.9", "J20.9"]', 'rising'),
(1, datetime('now'), 'malaria_rdt', 18, 1, '["B50"]', 'declining');

-- Forecasts (latest ML predictions)
INSERT INTO forecasts (hospital_id, forecast_date, predicted_volume, baseline_volume, surge_probability, risk_level, confidence_pct, shap_factors, model_version) VALUES
(1, date('now', '+1 days'), 126, 111, 0.20, 'LOW', 93, '[{"label": "Day of week", "value": 10.15}]', 'v1.0'),
(1, date('now', '+2 days'), 142, 111, 0.42, 'MEDIUM', 91, '[{"label": "Weekend accident pattern", "value": 14.2}, {"label": "Humidity drop >15%", "value": 8.7}]', 'v1.0'),
(1, date('now', '+3 days'), 158, 111, 0.63, 'HIGH', 88, '[{"label": "Festival travel window", "value": 22.1}, {"label": "Heavy rainfall activity", "value": 12.4}]', 'v1.0'),
(1, date('now', '+4 days'), 135, 111, 0.35, 'MEDIUM', 90, '[{"label": "Approaching festival surge", "value": 11.3}]', 'v1.0'),
(1, date('now', '+5 days'), 118, 111, 0.12, 'LOW', 94, '[{"label": "Normal seasonal baseline", "value": 1.8}]', 'v1.0'),
(1, date('now', '+6 days'), 112, 111, 0.05, 'LOW', 95, '[{"label": "Normal seasonal baseline", "value": 0.9}]', 'v1.0'),
(1, date('now', '+7 days'), 115, 111, 0.08, 'LOW', 94, '[{"label": "Post-weekend hospital load", "value": 3.2}]', 'v1.0');

-- Alerts (a couple of sample alerts)
INSERT INTO alerts (hospital_id, severity, title, message, source, status) VALUES
(1, 'warning', 'Rising ER Occupancy', 'ER occupancy has exceeded 80% for 3 consecutive hours. Consider activating overflow protocol.', 'risk_engine', 'active'),
(1, 'info', 'Dengue Positivity Trending Up', 'Dengue NS1 positivity rate has risen from 13% to 17% over the past 48 hours. Isolation capacity should be monitored.', 'risk_engine', 'acknowledged');
