/**
 * routes/replay.js
 *
 * Temporal Replay API — wraps hospitalReplayService for frontend consumption.
 *
 * GET /api/replay/timestamps         — list all available HH:MM timestamps
 * GET /api/replay/state/:timestamp   — resolve a single operational snapshot
 * GET /api/replay/scenario           — full prebuilt scenario (all frames) ready
 *                                      for direct injection into useReplayEngine
 */

'use strict';

const express = require('express');
const router  = express.Router();

const {
  resolveHospitalState,
  getAvailableTimestamps,
} = require('../services/hospitalReplayService');

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Maps a resolved hospitalReplayService snapshot to the `overrides` shape
 * consumed by the frontend OperationalControlPanel / useOperationalSync.
 *
 * This is the ONLY translation layer between dataset values and the frontend
 * override vocabulary.  Keep it here so the frontend never needs to know
 * about raw dataset field names.
 */
function snapshotToOverrides(snapshot) {
  const m = snapshot.metrics;

  return {
    // Road Network Strain (1–10)
    // Map trafficSeverity directly — already on 1–10 scale in dataset
    trafficSeverity: Math.round(Math.min(10, Math.max(1, m.trafficSeverity ?? 3))),

    // Respiratory Burden (0–50 %)
    // Dataset stores absolute positive test count; use positivityRate field
    respiratoryPositivity: Math.round(Math.min(50, Math.max(0, m.respiratoryPositive ?? 18))),

    // Staffing Availability (50–100 %)
    // Derived from fatigue: high fatigue → lower availability
    staffingAvailability: Math.round(Math.min(100, Math.max(50,
      100 - (m.fatigueLevel ?? 15) * 0.5
    ))),

    // ER Intake Pressure (0–100 %)
    erIntakeVolume: Math.round(Math.min(100, Math.max(0, m.erOccupancy ?? 45))),

    // ICU Stress Signal (0–100 %)
    icuCapacityPressure: Math.round(Math.min(100, Math.max(0, m.icuOccupancy ?? 65))),

    // Ambulance Deployment (1–15 active units)
    ambulanceLoad: Math.round(Math.min(15, Math.max(1, m.activeAmbulances ?? 6))),

    // Weather Severity (0 = clear, 1 = rain, 2 = heavy storm)
    // Infer from trafficSeverity + ambulance weather impact
    weatherSeverity:
      m.trafficSeverity >= 9 ? 2 :
      m.trafficSeverity >= 6 ? 1 : 0,
  };
}

/**
 * Generates a human-readable event label for a given replay frame,
 * matching the Monsoon Respiratory Surge narrative.
 */
function frameLabel(snapshot) {
  const { escalationLabel } = snapshot.escalation;
  const ts = snapshot.timestamp;

  const LABELS = {
    '06:00': 'Pre-shift baseline — systems nominal',
    '07:00': 'Shift change — mild rainfall beginning',
    '08:00': 'Transport degradation — ETA delays rising',
    '09:00': 'Traffic congestion peak — discharge velocity slowing',
    '10:00': 'Intake compression — ambulance cluster arrival',
    '11:00': 'ER boarding backlog initiating',
    '12:00': 'Isolation capacity strained — respiratory surge',
    '13:00': 'ICU boundary pressure — step-down beds locked',
    '14:00': 'Staffing reserve engaged — on-call pool activated',
    '15:00': 'Weather breaks — walk-in spike beginning',
    '16:00': 'Secondary trauma surge — imaging queue peaks',
    '17:00': 'Maximum operational saturation',
    '18:00': 'Discharge velocity recovering — ward beds clearing',
    '19:00': 'ER decompression — ICU residual lag persists',
    '20:00': 'Mid-acuity stabilization — on-call releasing',
    '21:00': 'Recovery plateau — ICU residual boarding',
    '22:00': 'Night handover — operational day closes',
  };

  return LABELS[ts] ?? `${ts} — ${escalationLabel}`;
}

/**
 * Generates a clinical annotation for the audit stream.
 */
function frameAnnotation(snapshot) {
  const { activeStressors } = snapshot.escalation;
  if (activeStressors.length === 0) return 'No active stressors. Operating within baseline parameters.';
  return `Active stressors: ${activeStressors.join(', ')}.`;
}

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/replay/timestamps
 * Returns the list of all HH:MM timestamps available in the timeline datasets.
 */
router.get('/timestamps', (req, res) => {
  try {
    const timestamps = getAvailableTimestamps();
    res.json({ success: true, timestamps });
  } catch (err) {
    console.error('[ReplayRoute] /timestamps error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load timestamps' });
  }
});

/**
 * GET /api/replay/state/:timestamp
 * Resolves and returns the full operational snapshot for a given HH:MM timestamp.
 * Nearest-neighbor fallback is handled by the service layer.
 *
 * Example: GET /api/replay/state/14:00
 */
router.get('/state/:timestamp', (req, res) => {
  const { timestamp } = req.params;

  // Validate loose format HH:MM
  if (!/^\d{1,2}:\d{2}$/.test(timestamp)) {
    return res.status(400).json({ success: false, error: 'Invalid timestamp format. Use HH:MM.' });
  }

  try {
    const snapshot = resolveHospitalState(timestamp);
    res.json({ success: true, snapshot });
  } catch (err) {
    console.error(`[ReplayRoute] /state/${timestamp} error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to resolve hospital state' });
  }
});

/**
 * GET /api/replay/scenario
 * Returns the complete Monsoon Respiratory Surge scenario as a replay-ready
 * frame array, directly consumable by the frontend useReplayEngine.load().
 *
 * Each frame contains:
 *   { time, label, annotation, overrides }
 *
 * This is the canonical dataset-driven replay scenario.
 */
router.get('/scenario', (req, res) => {
  try {
    const timestamps = getAvailableTimestamps();

    const frames = timestamps.map(ts => {
      const snapshot  = resolveHospitalState(ts);
      const overrides = snapshotToOverrides(snapshot);

      return {
        time:       ts,
        label:      frameLabel(snapshot),
        annotation: frameAnnotation(snapshot),
        overrides,
        // Attach the resolved readiness/escalation for display in ReplayControls
        _meta: {
          readinessScore:   snapshot.readiness.readinessScore,
          readinessPosture: snapshot.readiness.readinessPosture,
          escalationLabel:  snapshot.escalation.escalationLabel,
          activeStressors:  snapshot.escalation.activeStressors,
        },
      };
    });

    const scenario = {
      id:          'monsoon_respiratory_surge',
      name:        'Monsoon Respiratory Surge',
      description: 'Dataset-driven replay of a real Bengaluru monsoon surge event. Tracks ambulance delays, ER boarding, ICU saturation, and respiratory escalation across a full operational day.',
      icon:        '🌧',
      severity:    'critical',
      duration:    '16h',
      tags:        ['transport', 'respiratory', 'ICU', 'dataset-driven'],
      datasetDriven: true,
      frames,
    };

    res.json({ success: true, scenario });
  } catch (err) {
    console.error('[ReplayRoute] /scenario error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to build replay scenario' });
  }
});

module.exports = router;
