/**
 * hospitalReplayService.js
 *
 * Canonical temporal replay state resolver for the SurgeWatch platform.
 *
 * Purpose:
 *   Load the five synchronized hospital timeline datasets, resolve a
 *   fully merged operational snapshot for any requested HH:MM timestamp,
 *   and return a normalized operational state object that can drive:
 *     - replay mode
 *     - readiness modeling
 *     - forecasting deformation
 *     - protocol escalation
 *     - telemetry audit streams
 *     - predictive intelligence
 *
 * Convention note:
 *   Timeline datasets use "HH:MM" string timestamps (e.g. "14:00").
 *   This service mirrors the modular, flat-function style of hospitalDataService.js.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/hospital');

// ─── Dataset Manifest ─────────────────────────────────────────────────────────
// Maps a logical key to its timeline JSON filename.
const TIMELINE_FILES = {
  beds:      'bed_occupancy_timeline.json',
  staffing:  'staffing_timeline.json',
  ambulance: 'ambulance_timeline.json',
  lab:       'lab_positivity_timeline.json',
  arrivals:  'patient_arrivals_timeline.json',
};

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
// Datasets are loaded once per process lifetime. Hot-reloading is unnecessary
// for a replay service whose source files change only between sessions.
const _cache = {};

// ─── 1. DATASET LOADING ───────────────────────────────────────────────────────

/**
 * loadDataset(key)
 *
 * Loads a timeline dataset by logical key from the manifest, returning it
 * sorted ascending by timestamp (earliest first) so binary-search fallback
 * works correctly.
 *
 * Results are cached in-process after the first load.
 *
 * @param  {string} key - One of the keys in TIMELINE_FILES
 * @returns {Array}       Parsed array of hourly snapshot objects
 */
function loadDataset(key) {
  if (_cache[key]) return _cache[key];

  const filename = TIMELINE_FILES[key];
  if (!filename) {
    console.warn(`[ReplayService] Unknown dataset key: "${key}"`);
    return [];
  }

  try {
    const raw  = fs.readFileSync(path.join(DATA_DIR, filename), 'utf8');
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      console.warn(`[ReplayService] Dataset "${filename}" is not an array.`);
      return [];
    }

    // Sort ascending so index 0 = earliest (06:00)
    const sorted = data.slice().sort((a, b) => _tsMinutes(a.timestamp) - _tsMinutes(b.timestamp));
    _cache[key] = sorted;
    return sorted;

  } catch (err) {
    console.error(`[ReplayService] Failed to load "${filename}":`, err.message);
    return [];
  }
}

/**
 * loadAllDatasets()
 * Eagerly loads all timeline datasets and returns them as a keyed object.
 * Safe to call multiple times — returns from cache after the first call.
 */
function loadAllDatasets() {
  return Object.fromEntries(
    Object.keys(TIMELINE_FILES).map(key => [key, loadDataset(key)])
  );
}

/**
 * getAvailableTimestamps()
 * Returns the sorted list of all timestamps present in the beds dataset,
 * which is considered the master clock for replay.
 */
function getAvailableTimestamps() {
  return loadDataset('beds').map(s => s.timestamp);
}

// ─── 2. TIMESTAMP RESOLUTION ─────────────────────────────────────────────────

/**
 * _tsMinutes(ts)
 * Converts "HH:MM" to integer minutes for arithmetic comparison.
 */
function _tsMinutes(ts) {
  if (!ts || typeof ts !== 'string') return 0;
  const [h, m] = ts.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * findNearestSnapshot(dataset, timestamp)
 *
 * Returns the snapshot whose timestamp is closest to (but not after) the
 * requested timestamp.  If the timestamp precedes all entries, returns the
 * first entry.  If the dataset is empty, returns null.
 *
 * @param  {Array}  dataset   - Sorted-ascending array of snapshot objects
 * @param  {string} timestamp - "HH:MM" target
 * @returns {object|null}
 */
function findNearestSnapshot(dataset, timestamp) {
  if (!dataset || dataset.length === 0) return null;

  const target = _tsMinutes(timestamp);
  let best = dataset[0];

  for (const entry of dataset) {
    const entryMins = _tsMinutes(entry.timestamp);
    if (entryMins <= target) {
      best = entry;
    } else {
      break; // dataset is sorted ascending; no closer match possible
    }
  }

  return best;
}

// ─── 3. LIGHTWEIGHT OPERATIONAL DERIVATION ───────────────────────────────────
// These helpers derive human-readable operational summaries from raw timeline
// snapshots.  They intentionally avoid duplicating the full intelligence engine
// — they produce only what the replay state needs.

/**
 * deriveReplayOccupancy(beds)
 * Derives ICU/ER pressure and overall congestion from a bed snapshot.
 */
function deriveReplayOccupancy(beds) {
  if (!beds) {
    return { icuPressure: 'stable', erCongestion: 'stable', isolationStatus: 'available', occupancyMomentum: 'stable' };
  }

  const { icuOccupancy, erOccupancy, isolationOccupancy, boardingPatients, occupancyMomentum } = beds;

  const icuPressure =
    icuOccupancy >= 95 ? 'critical' :
    icuOccupancy >= 80 ? 'elevated' : 'stable';

  const erCongestion =
    erOccupancy >= 90 || boardingPatients >= 20 ? 'volatile' :
    erOccupancy >= 75 || boardingPatients >= 8  ? 'elevated' : 'stable';

  const isolationStatus =
    isolationOccupancy >= 98 ? 'exhausted' :
    isolationOccupancy >= 88 ? 'strained'  : 'available';

  return { icuPressure, erCongestion, isolationStatus, occupancyMomentum };
}

/**
 * deriveReplayStaffing(staffing)
 * Derives staffing stability from a staffing snapshot.
 */
function deriveReplayStaffing(staffing) {
  if (!staffing) {
    return { staffingStability: 'adequate', onCallActive: false };
  }

  const { staffingStatus, onCallEngaged, fatigueLevel } = staffing;

  // Prefer the explicit status label from the dataset when present
  const stability =
    staffingStatus === 'critical' ? 'fragile ratios' :
    staffingStatus === 'strained' ? 'strained'       : 'adequate';

  return {
    staffingStability: stability,
    onCallActive:      (onCallEngaged ?? 0) > 0,
    fatigueLevel:      fatigueLevel ?? 0,
  };
}

/**
 * deriveReplayTransport(ambulance)
 * Derives ambulance flow state and traffic severity from an ambulance snapshot.
 */
function deriveReplayTransport(ambulance) {
  if (!ambulance) {
    return { ambulanceFlow: 'normal', trafficSeverity: 2, averageETA: 12 };
  }

  const { averageETA, diversionStatus, trafficSeverity } = ambulance;

  const ambulanceFlow =
    averageETA >= 45 || diversionStatus === 'full'    ? 'critical intake compression' :
    averageETA >= 25 || diversionStatus === 'partial' ? 'delayed'                    : 'normal';

  return { ambulanceFlow, trafficSeverity: trafficSeverity ?? 3, averageETA: averageETA ?? 12 };
}

/**
 * deriveReplayRespiratory(lab)
 * Derives respiratory pressure from a lab positivity snapshot.
 */
function deriveReplayRespiratory(lab) {
  if (!lab) {
    return { respiratoryPressure: 'stable', positivityRate: 18 };
  }

  const { respiratoryPositive: positivityPct } = lab;

  const respiratoryPressure =
    positivityPct >= 40 ? 'critical surge strain'        :
    positivityPct >= 28 ? 'elevated syndromic pressure'  : 'stable';

  return { respiratoryPressure, positivityRate: positivityPct ?? 18 };
}

/**
 * deriveReplayArrivals(arrivals)
 * Derives intake pressure from a patient arrivals snapshot.
 */
function deriveReplayArrivals(arrivals) {
  if (!arrivals) {
    return { intakePressure: 'normal', triageSeverity: 'manageable' };
  }

  const { erWalkIns, ambulanceArrivals, triageCategory1, triageCategory2 } = arrivals;
  const totalArrivals = (erWalkIns ?? 0) + (ambulanceArrivals ?? 0);
  const criticalTriage = (triageCategory1 ?? 0) + (triageCategory2 ?? 0);

  const intakePressure =
    totalArrivals >= 60 ? 'severe'   :
    totalArrivals >= 40 ? 'elevated' : 'normal';

  const triageSeverity =
    criticalTriage >= 20 ? 'overwhelmed'    :
    criticalTriage >= 10 ? 'sustained strain' : 'manageable';

  return { intakePressure, triageSeverity, totalArrivals };
}

/**
 * deriveReplayReadiness(occupancy, staffing, transport, respiratory, arrivals)
 *
 * Produces a lightweight readiness score and posture label from the five
 * derived sub-states.  Mirrors the scoring logic of hospitalDataService but
 * adapted for the timeline snapshot field shapes.
 *
 * @returns {{ readinessScore: number, readinessPosture: string }}
 */
function deriveReplayReadiness(occupancy, staffing, transport, respiratory, arrivals) {
  let score = 100;

  // Capacity penalties
  if (occupancy.icuPressure    === 'critical')  score -= 14;
  else if (occupancy.icuPressure === 'elevated') score -= 7;

  if (occupancy.erCongestion   === 'volatile')  score -= 12;
  else if (occupancy.erCongestion === 'elevated') score -= 5;

  if (occupancy.isolationStatus === 'exhausted') score -= 12;
  else if (occupancy.isolationStatus === 'strained') score -= 5;

  // Staffing penalty
  if (staffing.staffingStability === 'fragile ratios') score -= 14;
  else if (staffing.staffingStability === 'strained')  score -= 6;
  if (staffing.fatigueLevel >= 90) score -= 6;

  // Transport penalty
  if (transport.ambulanceFlow === 'critical intake compression') score -= 14;
  else if (transport.ambulanceFlow === 'delayed')                score -= 6;

  // Respiratory penalty
  if (respiratory.respiratoryPressure === 'critical surge strain')       score -= 10;
  else if (respiratory.respiratoryPressure === 'elevated syndromic pressure') score -= 5;

  // Arrival / intake penalty
  if (arrivals.intakePressure === 'severe')   score -= 8;
  else if (arrivals.intakePressure === 'elevated') score -= 4;

  // Momentum bonus/penalty
  if (occupancy.occupancyMomentum === 'critical')     score -= 8;
  else if (occupancy.occupancyMomentum === 'recovering') score += 4;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const readinessPosture =
    score < 35 ? 'Critical Surge'          :
    score < 55 ? 'Regional Emergency Coordination' :
    score < 70 ? 'Surge Protocol'          :
    score < 85 ? 'Elevated Monitoring'     : 'Baseline';

  return { readinessScore: score, readinessPosture };
}

/**
 * deriveReplayEscalation(occupancy, staffing, transport, respiratory, arrivals)
 *
 * Counts active stressor flags and maps to an escalation tier.
 * Mirrors the escalation factor logic in useOperationalSync.js.
 *
 * @returns {{ escalationRisk: string, activeStressors: string[], escalationLabel: string }}
 */
function deriveReplayEscalation(occupancy, staffing, transport, respiratory, arrivals) {
  const stressors = [];

  if (occupancy.icuPressure    === 'critical')                     stressors.push('ICU critical');
  if (occupancy.erCongestion   === 'volatile')                     stressors.push('ER volatile');
  if (occupancy.isolationStatus === 'exhausted')                   stressors.push('Isolation exhausted');
  if (staffing.staffingStability === 'fragile ratios')             stressors.push('Staffing fragile');
  if (transport.ambulanceFlow  === 'critical intake compression')  stressors.push('Ambulance diversion');
  if (respiratory.respiratoryPressure === 'critical surge strain') stressors.push('Respiratory critical');
  if (arrivals.intakePressure  === 'severe')                       stressors.push('Intake severe');

  const count = stressors.length;

  const escalationRisk =
    count >= 5 ? 'critical' :
    count >= 3 ? 'elevated' :
    count >= 1 ? 'low'      : 'low';

  const escalationLabel =
    count >= 5 ? 'Critical Surge'                    :
    count >= 4 ? 'Regional Emergency Coordination'   :
    count >= 3 ? 'Surge Protocol'                    :
    count >= 2 ? 'Elevated Monitoring'               : 'Baseline';

  return { escalationRisk, activeStressors: stressors, escalationLabel };
}

// ─── 4. PRIMARY RESOLVER ─────────────────────────────────────────────────────

/**
 * resolveHospitalState(timestamp)
 *
 * Loads all five timeline datasets, resolves the nearest snapshot for each
 * at the requested timestamp, derives lightweight operational state, and
 * returns a single unified replay operational snapshot object.
 *
 * Example:
 *   resolveHospitalState("14:00")
 *   → { timestamp, occupancy, staffing, ambulance, lab, arrivals, readiness, escalation }
 *
 * @param  {string} timestamp - Target "HH:MM" string
 * @returns {object}           Normalized operational snapshot
 */
function resolveHospitalState(timestamp) {
  const { beds, staffing, ambulance, lab, arrivals } = loadAllDatasets();

  // Resolve nearest snapshot per dataset
  const bedSnap       = findNearestSnapshot(beds,      timestamp);
  const staffingSnap  = findNearestSnapshot(staffing,  timestamp);
  const ambulanceSnap = findNearestSnapshot(ambulance, timestamp);
  const labSnap       = findNearestSnapshot(lab,       timestamp);
  const arrivalsSnap  = findNearestSnapshot(arrivals,  timestamp);

  // Derive lightweight operational sub-states
  const occState   = deriveReplayOccupancy(bedSnap);
  const staffState = deriveReplayStaffing(staffingSnap);
  const transState = deriveReplayTransport(ambulanceSnap);
  const respState  = deriveReplayRespiratory(labSnap);
  const arrState   = deriveReplayArrivals(arrivalsSnap);

  // Derive readiness and escalation from unified sub-states
  const readiness  = deriveReplayReadiness(occState, staffState, transState, respState, arrState);
  const escalation = deriveReplayEscalation(occState, staffState, transState, respState, arrState);

  return {
    // ── Meta ──────────────────────────────────────────────────────────────────
    timestamp,
    resolvedTimestamps: {
      beds:      bedSnap?.timestamp      ?? null,
      staffing:  staffingSnap?.timestamp ?? null,
      ambulance: ambulanceSnap?.timestamp ?? null,
      lab:       labSnap?.timestamp      ?? null,
      arrivals:  arrivalsSnap?.timestamp ?? null,
    },

    // ── Raw Snapshots ─────────────────────────────────────────────────────────
    // Exposed so downstream consumers can read original dataset values directly.
    occupancy: bedSnap       ?? {},
    staffing:  staffingSnap  ?? {},
    ambulance: ambulanceSnap ?? {},
    lab:       labSnap       ?? {},
    arrivals:  arrivalsSnap  ?? {},

    // ── Derived Operational State ─────────────────────────────────────────────
    // These fields mirror the vocabulary of the frontend intelligence layer so
    // replay snapshots can be fed directly into useOperationalSync overrides.
    operationalState: {
      // Primary stressor signals (compatible with useOperationalSync vocabulary)
      icuPressure:          occState.icuPressure,
      erCongestion:         occState.erCongestion,
      isolationStatus:      occState.isolationStatus,
      occupancyMomentum:    occState.occupancyMomentum,
      staffingStability:    staffState.staffingStability,
      onCallActive:         staffState.onCallActive,
      ambulanceFlow:        transState.ambulanceFlow,
      respiratoryPressure:  respState.respiratoryPressure,
      intakePressure:       arrState.intakePressure,
      triageSeverity:       arrState.triageSeverity,
      escalationRisk:       escalation.escalationRisk,
    },

    // ── Key Metrics ───────────────────────────────────────────────────────────
    // Numeric values for downstream chart deformation, OSI computation, etc.
    metrics: {
      icuOccupancy:           bedSnap?.icuOccupancy          ?? 65,
      erOccupancy:            bedSnap?.erOccupancy            ?? 45,
      generalWardOccupancy:   bedSnap?.generalWardOccupancy   ?? 70,
      pediatricsOccupancy:    bedSnap?.pediatricsOccupancy    ?? 80,
      isolationOccupancy:     bedSnap?.isolationOccupancy     ?? 80,
      boardingPatients:       bedSnap?.boardingPatients       ?? 0,
      dischargeVelocity:      bedSnap?.dischargeVelocity      ?? 'normal',
      nursesOnDuty:           staffingSnap?.nursesOnDuty      ?? 42,
      doctorsOnDuty:          staffingSnap?.doctorsOnDuty     ?? 12,
      onCallEngaged:          staffingSnap?.onCallEngaged      ?? 0,
      fatigueLevel:           staffingSnap?.fatigueLevel       ?? 15,
      activeAmbulances:       ambulanceSnap?.activeAmbulances  ?? 6,
      averageETA:             ambulanceSnap?.averageETA        ?? 12,
      trafficSeverity:        ambulanceSnap?.trafficSeverity   ?? 2,
      diversionStatus:        ambulanceSnap?.diversionStatus   ?? 'none',
      respiratoryPositive:    labSnap?.respiratoryPositive     ?? 18,
      testsPerformed:         labSnap?.testsPerformed          ?? 24,
      labBacklog:             labSnap?.labBacklog              ?? 2,
      erWalkIns:              arrivalsSnap?.erWalkIns          ?? 12,
      ambulanceArrivals:      arrivalsSnap?.ambulanceArrivals  ?? 4,
      totalArrivals:          arrState.totalArrivals           ?? 16,
    },

    // ── Readiness & Escalation ────────────────────────────────────────────────
    readiness,
    escalation,
  };
}

// ─── 5. EXPORTS ──────────────────────────────────────────────────────────────

module.exports = {
  // Primary API
  resolveHospitalState,

  // Dataset utilities
  loadDataset,
  loadAllDatasets,
  getAvailableTimestamps,

  // Snapshot resolver (exposed for testing / extension)
  findNearestSnapshot,

  // Derivation helpers (exposed for unit-testing and custom consumers)
  deriveReplayOccupancy,
  deriveReplayStaffing,
  deriveReplayTransport,
  deriveReplayRespiratory,
  deriveReplayArrivals,
  deriveReplayReadiness,
  deriveReplayEscalation,
};
