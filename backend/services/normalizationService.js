/**
 * SurgeWatch Normalization Service
 * 
 * Maps heterogeneous hospital data fields into a standardized internal schema.
 * Different hospitals call the same things different names:
 *   - "icuBeds", "icu_capacity", "availableICU" → all become "availableICUBeds"
 * 
 * This service provides:
 * 1. Field mapping (aliasing)
 * 2. Type validation
 * 3. Range checking
 * 4. Fallback defaults for missing fields
 * 5. Data quality flagging
 */

// ─── Field Mapping Dictionary ─────────────────────────────────────────────────
// Maps any variant name → our standard internal field name

const FIELD_MAPS = {
    // Bed-related
    'icuBeds': 'availableICUBeds',
    'icu_capacity': 'availableICUBeds',
    'availableICU': 'availableICUBeds',
    'icu_available': 'availableICUBeds',
    'icu_free': 'availableICUBeds',

    'erBeds': 'availableERBeds',
    'er_capacity': 'availableERBeds',
    'emergency_beds': 'availableERBeds',
    'er_available': 'availableERBeds',

    'generalBeds': 'availableGeneralBeds',
    'general_capacity': 'availableGeneralBeds',
    'gen_beds_free': 'availableGeneralBeds',

    'totalBeds': 'totalBeds',
    'total_bed_count': 'totalBeds',
    'bed_count': 'totalBeds',

    'occupiedBeds': 'occupiedBeds',
    'beds_in_use': 'occupiedBeds',
    'occupied_bed_count': 'occupiedBeds',

    // Occupancy
    'occupancy': 'occupancyPct',
    'occupancy_pct': 'occupancyPct',
    'occupancy_rate': 'occupancyPct',
    'bed_occupancy': 'occupancyPct',
    'occupancy_percent': 'occupancyPct',

    // Admissions & Visits
    'admissions': 'totalAdmissions',
    'total_admissions': 'totalAdmissions',
    'new_admissions': 'totalAdmissions',
    'admits': 'totalAdmissions',

    'discharges': 'totalDischarges',
    'total_discharges': 'totalDischarges',
    'discharged': 'totalDischarges',

    'erVisits': 'erVisits',
    'er_visits': 'erVisits',
    'emergency_visits': 'erVisits',
    'ed_visits': 'erVisits',

    // Staffing
    'nurses': 'nursesOnDuty',
    'nurses_on_duty': 'nursesOnDuty',
    'nursing_staff': 'nursesOnDuty',
    'nurse_count': 'nursesOnDuty',

    'doctors': 'doctorsOnDuty',
    'doctors_on_duty': 'doctorsOnDuty',
    'physician_count': 'doctorsOnDuty',
    'doc_count': 'doctorsOnDuty',

    'nursePatientRatio': 'nursePatientRatio',
    'nurse_patient_ratio': 'nursePatientRatio',
    'npr': 'nursePatientRatio',

    // Wait times
    'waitTime': 'avgWaitTimeMin',
    'avg_wait_time': 'avgWaitTimeMin',
    'average_wait': 'avgWaitTimeMin',
    'wait_time_min': 'avgWaitTimeMin',
    'er_wait': 'avgWaitTimeMin',

    // Ambulance
    'ambulanceArrivals': 'ambulanceArrivals',
    'ambulance_arrivals': 'ambulanceArrivals',
    'ambulance_count': 'ambulanceArrivals',
    'amb_arrivals': 'ambulanceArrivals',

    // Ventilators
    'ventilatorsInUse': 'ventilatorsInUse',
    'ventilators_in_use': 'ventilatorsInUse',
    'vents_active': 'ventilatorsInUse',

    'ventilatorsTotal': 'ventilatorsTotal',
    'ventilators_total': 'ventilatorsTotal',
    'total_vents': 'ventilatorsTotal',

    // Temperature & Weather
    'temp': 'temperature',
    'temperature': 'temperature',
    'temp_c': 'temperature',

    'humidity': 'humidity',
    'relative_humidity': 'humidity',
    'rh': 'humidity',

    'rainfall': 'rainfallMm',
    'rainfall_mm': 'rainfallMm',
    'precipitation': 'rainfallMm',
};

// ─── Validation Rules ─────────────────────────────────────────────────────────

const VALIDATION_RULES = {
    occupancyPct:       { type: 'number', min: 0, max: 100 },
    totalAdmissions:    { type: 'integer', min: 0, max: 500 },
    totalDischarges:    { type: 'integer', min: 0, max: 500 },
    erVisits:           { type: 'integer', min: 0, max: 300 },
    nursesOnDuty:       { type: 'integer', min: 0, max: 200 },
    doctorsOnDuty:      { type: 'integer', min: 0, max: 100 },
    nursePatientRatio:  { type: 'number', min: 0, max: 5 },
    avgWaitTimeMin:     { type: 'number', min: 0, max: 300 },
    ambulanceArrivals:  { type: 'integer', min: 0, max: 100 },
    totalBeds:          { type: 'integer', min: 1, max: 2000 },
    occupiedBeds:       { type: 'integer', min: 0, max: 2000 },
    availableICUBeds:   { type: 'integer', min: 0, max: 200 },
    availableERBeds:    { type: 'integer', min: 0, max: 200 },
    availableGeneralBeds: { type: 'integer', min: 0, max: 1500 },
    ventilatorsInUse:   { type: 'integer', min: 0, max: 100 },
    ventilatorsTotal:   { type: 'integer', min: 0, max: 100 },
    temperature:        { type: 'number', min: -10, max: 55 },
    humidity:           { type: 'number', min: 0, max: 100 },
    rainfallMm:         { type: 'number', min: 0, max: 500 },
};

// ─── Default Values ───────────────────────────────────────────────────────────

const DEFAULTS = {
    occupancyPct: 0,
    totalAdmissions: 0,
    totalDischarges: 0,
    erVisits: 0,
    nursesOnDuty: 0,
    doctorsOnDuty: 0,
    nursePatientRatio: null,
    avgWaitTimeMin: null,
    ambulanceArrivals: 0,
    totalBeds: null,
    occupiedBeds: null,
    availableICUBeds: null,
    availableERBeds: null,
    availableGeneralBeds: null,
    ventilatorsInUse: 0,
    ventilatorsTotal: 0,
    temperature: null,
    humidity: null,
    rainfallMm: 0,
};

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Normalize a single key name to the internal standard.
 * Returns the original key if no mapping exists.
 */
function normalizeFieldName(key) {
    return FIELD_MAPS[key] || key;
}

/**
 * Validate a single value against its rule.
 * Returns { valid, value, warning }
 */
function validateField(fieldName, value) {
    const rule = VALIDATION_RULES[fieldName];
    if (!rule) return { valid: true, value, warning: null };

    // Type coercion
    if (rule.type === 'integer') {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) return { valid: false, value: DEFAULTS[fieldName], warning: `${fieldName}: expected integer, got '${value}'` };
        value = parsed;
    } else if (rule.type === 'number') {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) return { valid: false, value: DEFAULTS[fieldName], warning: `${fieldName}: expected number, got '${value}'` };
        value = parsed;
    }

    // Range checking
    if (rule.min !== undefined && value < rule.min) {
        return { valid: false, value: rule.min, warning: `${fieldName}: value ${value} below minimum ${rule.min}, clamped` };
    }
    if (rule.max !== undefined && value > rule.max) {
        return { valid: false, value: rule.max, warning: `${fieldName}: value ${value} above maximum ${rule.max}, clamped` };
    }

    return { valid: true, value, warning: null };
}

/**
 * Normalize a raw data object from any hospital system into standardized format.
 * 
 * @param {object} rawData - The incoming data with potentially non-standard field names
 * @returns {{ normalized: object, warnings: string[], dataQuality: string }}
 */
function normalize(rawData) {
    if (!rawData || typeof rawData !== 'object') {
        return {
            normalized: { ...DEFAULTS },
            warnings: ['Input data is null or not an object'],
            dataQuality: 'missing'
        };
    }

    const normalized = {};
    const warnings = [];
    let validCount = 0;
    let totalFields = 0;

    // Map and validate each field
    for (const [rawKey, rawValue] of Object.entries(rawData)) {
        const standardKey = normalizeFieldName(rawKey);

        // Skip unknown fields (but don't warn — they might be metadata)
        if (!VALIDATION_RULES[standardKey] && !DEFAULTS.hasOwnProperty(standardKey)) {
            continue;
        }

        totalFields++;
        const { valid, value, warning } = validateField(standardKey, rawValue);

        normalized[standardKey] = value;
        if (valid) validCount++;
        if (warning) warnings.push(warning);
    }

    // Fill in missing fields with defaults
    for (const [key, defaultValue] of Object.entries(DEFAULTS)) {
        if (normalized[key] === undefined) {
            normalized[key] = defaultValue;
        }
    }

    // Determine data quality
    let dataQuality = 'good';
    if (totalFields === 0) {
        dataQuality = 'missing';
    } else if (validCount / totalFields < 0.7) {
        dataQuality = 'degraded';
    }

    return { normalized, warnings, dataQuality };
}

/**
 * Normalize an array of raw records (e.g., from a CSV).
 * @param {Array} records - Array of raw data objects
 * @returns {{ results: Array, totalWarnings: number, quality: string }}
 */
function normalizeBatch(records) {
    if (!Array.isArray(records)) {
        return { results: [], totalWarnings: 1, quality: 'missing' };
    }

    let totalWarnings = 0;
    let goodCount = 0;

    const results = records.map(record => {
        const result = normalize(record);
        totalWarnings += result.warnings.length;
        if (result.dataQuality === 'good') goodCount++;
        return result;
    });

    const overallQuality = goodCount / results.length >= 0.8 ? 'good' : 'degraded';

    return { results, totalWarnings, quality: overallQuality };
}

module.exports = {
    normalize,
    normalizeBatch,
    normalizeFieldName,
    validateField,
    FIELD_MAPS,
    DEFAULTS
};
