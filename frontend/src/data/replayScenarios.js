/**
 * SurgeWatch Operational Replay Scenarios
 *
 * Each scenario defines a time-indexed progression of operational override frames.
 * Frames transition causally — each step builds on the previous to create
 * believable hospital operational deterioration and recovery arcs.
 *
 * Frame shape:
 * {
 *   time: string        (display label, e.g. "08:00")
 *   label: string       (event description shown in UI)
 *   annotation: string  (clinical context note)
 *   overrides: object   (full override snapshot for this moment)
 * }
 */

import { DEFAULT_OVERRIDES } from '../components/dashboard/OperationalControlPanel';

// Convenience builder
const frame = (time, label, annotation, overrides) => ({
  time, label, annotation,
  overrides: { ...DEFAULT_OVERRIDES, ...overrides },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const REPLAY_SCENARIOS = [
  {
    id: 'monsoon_surge',
    name: 'Monsoon Surge',
    description: 'Heavy rainfall triggers transit collapse, cascading into ER congestion and ICU pressure.',
    icon: '🌧',
    severity: 'high',
    duration: '8h',
    tags: ['transport', 'weather', 'ER'],
    frames: [
      frame('06:00', 'Pre-shift baseline', 'All departments operating within nominal parameters. Morning handover underway.', {
        trafficSeverity: 2, respiratoryPositivity: 10, staffingAvailability: 88, erIntakeVolume: 35, icuCapacityPressure: 65, ambulanceLoad: 4, weatherSeverity: 0,
      }),
      frame('08:00', 'Rain begins, traffic rising', 'Monsoon onset detected. Outer Ring Road congestion beginning. Ambulance ETAs extending.', {
        trafficSeverity: 5, respiratoryPositivity: 10, staffingAvailability: 88, erIntakeVolume: 40, icuCapacityPressure: 66, ambulanceLoad: 5, weatherSeverity: 1,
      }),
      frame('10:00', 'Heavy rain — ambulance ETA spike', 'Silk Board corridor immobilized. Average ETA exceeding 28 minutes. Intake compression beginning.', {
        trafficSeverity: 8, respiratoryPositivity: 11, staffingAvailability: 85, erIntakeVolume: 52, icuCapacityPressure: 70, ambulanceLoad: 8, weatherSeverity: 1,
      }),
      frame('12:00', 'Storm peak — ER congestion', 'Severe storm conditions. Critical intake compression. ER boarding pressure rising rapidly.', {
        trafficSeverity: 10, respiratoryPositivity: 13, staffingAvailability: 82, erIntakeVolume: 72, icuCapacityPressure: 76, ambulanceLoad: 11, weatherSeverity: 2,
      }),
      frame('14:00', 'ICU saturation approaching', 'ER overflow pushing patients to ICU prematurely. Staffing fatigue elevating. Boarding bottleneck worsening.', {
        trafficSeverity: 9, respiratoryPositivity: 15, staffingAvailability: 74, erIntakeVolume: 82, icuCapacityPressure: 87, ambulanceLoad: 13, weatherSeverity: 2,
      }),
      frame('16:00', 'Escalation posture — Critical', 'Regional diversion protocols evaluated. ICU near saturation. Surge staffing requested.', {
        trafficSeverity: 10, respiratoryPositivity: 17, staffingAvailability: 68, erIntakeVolume: 90, icuCapacityPressure: 93, ambulanceLoad: 14, weatherSeverity: 2,
      }),
      frame('18:00', 'Storm easing — early recovery', 'Rain intensity reducing. Traffic beginning to clear. ER intake decelerating. Staffing reinforcements arriving.', {
        trafficSeverity: 6, respiratoryPositivity: 14, staffingAvailability: 78, erIntakeVolume: 68, icuCapacityPressure: 85, ambulanceLoad: 9, weatherSeverity: 1,
      }),
      frame('20:00', 'Recovery phase', 'Conditions normalizing. Ambulance ETAs returning to baseline. Surge protocols standing down.', {
        trafficSeverity: 3, respiratoryPositivity: 12, staffingAvailability: 85, erIntakeVolume: 45, icuCapacityPressure: 74, ambulanceLoad: 5, weatherSeverity: 0,
      }),
    ],
  },

  {
    id: 'viral_outbreak',
    name: 'Viral Outbreak',
    description: 'Respiratory positivity surge drives isolation demand, ICU saturation, and clinical staff exhaustion.',
    icon: '🦠',
    severity: 'critical',
    duration: '5d',
    tags: ['respiratory', 'ICU', 'isolation'],
    frames: [
      frame('Day 1 · 08:00', 'Baseline — low viral signal', 'Routine respiratory monitoring. Positivity within seasonal norms.', {
        trafficSeverity: 3, respiratoryPositivity: 10, staffingAvailability: 88, erIntakeVolume: 38, icuCapacityPressure: 64, ambulanceLoad: 4, weatherSeverity: 0,
      }),
      frame('Day 1 · 20:00', 'Positivity uptick detected', 'Lab signal rising. Isolation precautions elevated. Watch advisory issued.', {
        trafficSeverity: 3, respiratoryPositivity: 15, staffingAvailability: 86, erIntakeVolume: 42, icuCapacityPressure: 68, ambulanceLoad: 5, weatherSeverity: 0,
      }),
      frame('Day 2 · 12:00', 'Community spread confirmed', 'Multiple clusters identified. Respiratory presentations surging. ICU isolation beds allocated.', {
        trafficSeverity: 4, respiratoryPositivity: 22, staffingAvailability: 82, erIntakeVolume: 55, icuCapacityPressure: 76, ambulanceLoad: 7, weatherSeverity: 0,
      }),
      frame('Day 3 · 08:00', 'Outbreak classification', 'Viral surge officially classified. Elective procedures suspended. Isolation demand approaching limits.', {
        trafficSeverity: 4, respiratoryPositivity: 30, staffingAvailability: 75, erIntakeVolume: 68, icuCapacityPressure: 84, ambulanceLoad: 9, weatherSeverity: 0,
      }),
      frame('Day 3 · 20:00', 'ICU critical saturation', 'ICU respiratory beds at 91%. Staff exposure reports emerging. Fatigue index critical.', {
        trafficSeverity: 4, respiratoryPositivity: 36, staffingAvailability: 65, erIntakeVolume: 78, icuCapacityPressure: 93, ambulanceLoad: 11, weatherSeverity: 0,
      }),
      frame('Day 4 · 12:00', 'Regional emergency declared', 'Hospital network coordination activated. Transfer protocols for non-respiratory patients underway.', {
        trafficSeverity: 5, respiratoryPositivity: 42, staffingAvailability: 60, erIntakeVolume: 88, icuCapacityPressure: 97, ambulanceLoad: 13, weatherSeverity: 0,
      }),
      frame('Day 5 · 08:00', 'Peak — beginning of stabilization', 'Positivity plateau detected. PPE and staff support arriving. Slow decompression beginning.', {
        trafficSeverity: 4, respiratoryPositivity: 38, staffingAvailability: 66, erIntakeVolume: 80, icuCapacityPressure: 90, ambulanceLoad: 10, weatherSeverity: 0,
      }),
      frame('Day 5 · 20:00', 'Early recovery', 'Positivity rate trending down. ICU beds releasing. Staff recovery protocol initiated.', {
        trafficSeverity: 3, respiratoryPositivity: 28, staffingAvailability: 76, erIntakeVolume: 62, icuCapacityPressure: 80, ambulanceLoad: 7, weatherSeverity: 0,
      }),
    ],
  },

  {
    id: 'staffing_collapse',
    name: 'Staffing Collapse',
    description: 'Sudden staffing loss compounds existing pressure into a cascading capacity crisis.',
    icon: '👥',
    severity: 'high',
    duration: '10h',
    tags: ['staffing', 'capacity', 'burnout'],
    frames: [
      frame('06:00', 'Stable morning shift', 'Adequate staffing entering day shift. Occupancy within normal range.', {
        trafficSeverity: 3, respiratoryPositivity: 12, staffingAvailability: 90, erIntakeVolume: 38, icuCapacityPressure: 68, ambulanceLoad: 4, weatherSeverity: 0,
      }),
      frame('08:00', 'Staff call-offs begin', 'Multiple nurses report illness. Early fatigue indicators rising in ICU and ER.', {
        trafficSeverity: 3, respiratoryPositivity: 13, staffingAvailability: 80, erIntakeVolume: 42, icuCapacityPressure: 70, ambulanceLoad: 5, weatherSeverity: 0,
      }),
      frame('10:00', 'Critical shortfall emerging', 'ICU nurse-to-patient ratio breaching 1:3 threshold. Mandatory overtime initiated.', {
        trafficSeverity: 3, respiratoryPositivity: 13, staffingAvailability: 72, erIntakeVolume: 50, icuCapacityPressure: 75, ambulanceLoad: 6, weatherSeverity: 0,
      }),
      frame('12:00', 'Staffing fragile — triage pressure', 'Reduced throughput causing ER boarding. Bed turnover rate declining. Admissions backing up.', {
        trafficSeverity: 4, respiratoryPositivity: 14, staffingAvailability: 65, erIntakeVolume: 62, icuCapacityPressure: 80, ambulanceLoad: 8, weatherSeverity: 0,
      }),
      frame('14:00', 'Critical ratios across 3 departments', 'Staffing below safe thresholds in ICU, ER, and Surgical. Discharge velocity halved.', {
        trafficSeverity: 4, respiratoryPositivity: 14, staffingAvailability: 58, erIntakeVolume: 74, icuCapacityPressure: 87, ambulanceLoad: 10, weatherSeverity: 0,
      }),
      frame('16:00', 'Escalation — surge staffing requested', 'Agency and PRN staff mobilized. Critical incident notification issued to leadership.', {
        trafficSeverity: 5, respiratoryPositivity: 15, staffingAvailability: 54, erIntakeVolume: 83, icuCapacityPressure: 92, ambulanceLoad: 12, weatherSeverity: 0,
      }),
      frame('18:00', 'First relief arrivals', 'Agency nurses on-site. Mandatory overtime authorizations extended. Slow ratio improvement.', {
        trafficSeverity: 4, respiratoryPositivity: 14, staffingAvailability: 63, erIntakeVolume: 74, icuCapacityPressure: 86, ambulanceLoad: 9, weatherSeverity: 0,
      }),
      frame('20:00', 'Stabilizing', 'Evening shift supplemented. Ratios approaching safe threshold. Escalation posture de-escalating.', {
        trafficSeverity: 3, respiratoryPositivity: 12, staffingAvailability: 76, erIntakeVolume: 58, icuCapacityPressure: 78, ambulanceLoad: 6, weatherSeverity: 0,
      }),
    ],
  },

  {
    id: 'multi_system_failure',
    name: 'Multi-System Failure',
    description: 'Simultaneous weather, staffing, and respiratory pressure create a compounding cascade across all hospital systems.',
    icon: '⚡',
    severity: 'critical',
    duration: '12h',
    tags: ['cascade', 'critical', 'multi-domain'],
    frames: [
      frame('06:00', 'Baseline — normal operations', 'Systems nominal entering day shift. No active surge indicators.', {
        trafficSeverity: 2, respiratoryPositivity: 10, staffingAvailability: 88, erIntakeVolume: 35, icuCapacityPressure: 62, ambulanceLoad: 4, weatherSeverity: 0,
      }),
      frame('08:00', 'Weather advisory issued', 'Storm front approaching. Traffic pre-emptively worsening. Staff attendance uncertainty rising.', {
        trafficSeverity: 5, respiratoryPositivity: 12, staffingAvailability: 84, erIntakeVolume: 42, icuCapacityPressure: 66, ambulanceLoad: 5, weatherSeverity: 1,
      }),
      frame('10:00', 'Storm + viral + early staffing gap', 'Heavy rain onset. Lab positivity spiking independently. Three staff call-offs in ER.', {
        trafficSeverity: 8, respiratoryPositivity: 19, staffingAvailability: 75, erIntakeVolume: 58, icuCapacityPressure: 74, ambulanceLoad: 8, weatherSeverity: 2,
      }),
      frame('12:00', 'Cascade begins — all systems strained', 'Critical intake compression from storm. ICU isolation demand from viral spike. Staffing below threshold.', {
        trafficSeverity: 10, respiratoryPositivity: 27, staffingAvailability: 65, erIntakeVolume: 76, icuCapacityPressure: 85, ambulanceLoad: 12, weatherSeverity: 2,
      }),
      frame('14:00', 'Full cascade — critical posture', 'ER in boarding failure. ICU at 93% with respiratory backlog. Staffing fragile. Ambulance ETAs exceeding 45min.', {
        trafficSeverity: 10, respiratoryPositivity: 34, staffingAvailability: 57, erIntakeVolume: 90, icuCapacityPressure: 95, ambulanceLoad: 14, weatherSeverity: 2,
      }),
      frame('16:00', 'Regional emergency coordination', 'Network diversion activated. Transfer of stable patients to partner hospitals underway.', {
        trafficSeverity: 9, respiratoryPositivity: 38, staffingAvailability: 54, erIntakeVolume: 92, icuCapacityPressure: 97, ambulanceLoad: 14, weatherSeverity: 2,
      }),
      frame('18:00', 'Storm abating — slow decompression', 'Rain easing. Traffic beginning to clear. Emergency surge staffing on-site. Gradual relief.', {
        trafficSeverity: 6, respiratoryPositivity: 32, staffingAvailability: 62, erIntakeVolume: 80, icuCapacityPressure: 90, ambulanceLoad: 11, weatherSeverity: 1,
      }),
      frame('20:00', 'Recovery trajectory confirmed', 'All three pressure vectors declining. Readiness posture improving. Protocol stand-down sequence initiated.', {
        trafficSeverity: 4, respiratoryPositivity: 24, staffingAvailability: 72, erIntakeVolume: 66, icuCapacityPressure: 82, ambulanceLoad: 7, weatherSeverity: 0,
      }),
    ],
  },

  {
    id: 'respiratory_wave',
    name: 'Respiratory Wave',
    description: 'Gradual respiratory positivity build over 3 days strains isolation capacity and forces protocol escalation.',
    icon: '🫁',
    severity: 'moderate',
    duration: '3d',
    tags: ['respiratory', 'isolation', 'gradual'],
    frames: [
      frame('Day 1 · AM', 'Seasonal baseline', 'Respiratory positivity within seasonal norms. Isolation beds available. No alerts.', {
        trafficSeverity: 3, respiratoryPositivity: 9, staffingAvailability: 88, erIntakeVolume: 36, icuCapacityPressure: 63, ambulanceLoad: 4, weatherSeverity: 0,
      }),
      frame('Day 1 · PM', 'Mild positivity uptick', 'Lab signals rising slightly. Precautionary isolation protocols reviewed by infection control.', {
        trafficSeverity: 3, respiratoryPositivity: 14, staffingAvailability: 87, erIntakeVolume: 40, icuCapacityPressure: 65, ambulanceLoad: 5, weatherSeverity: 0,
      }),
      frame('Day 2 · AM', 'Sustained elevation', 'Positivity rate at 20%. ICU respiratory admissions +18% above baseline. Isolation occupancy climbing.', {
        trafficSeverity: 3, respiratoryPositivity: 20, staffingAvailability: 84, erIntakeVolume: 48, icuCapacityPressure: 72, ambulanceLoad: 6, weatherSeverity: 0,
      }),
      frame('Day 2 · PM', 'Isolation stress — elevated', 'Two isolation wings at capacity. Cohorting strategy activated. Staff PPE consumption spike.', {
        trafficSeverity: 4, respiratoryPositivity: 27, staffingAvailability: 80, erIntakeVolume: 56, icuCapacityPressure: 79, ambulanceLoad: 7, weatherSeverity: 0,
      }),
      frame('Day 3 · AM', 'Peak respiratory pressure', 'Positivity at 34%. Isolation beds exhausted. Conversion of standard units underway.', {
        trafficSeverity: 4, respiratoryPositivity: 34, staffingAvailability: 73, erIntakeVolume: 65, icuCapacityPressure: 88, ambulanceLoad: 9, weatherSeverity: 0,
      }),
      frame('Day 3 · PM', 'Plateau detected — gradual relief', 'Positivity rate stabilizing. Community mitigation measures taking effect. ICU beginning to decompress.', {
        trafficSeverity: 3, respiratoryPositivity: 28, staffingAvailability: 78, erIntakeVolume: 55, icuCapacityPressure: 82, ambulanceLoad: 7, weatherSeverity: 0,
      }),
    ],
  },

  {
    id: 'mass_casualty',
    name: 'Mass Casualty Event',
    description: 'Sudden mass casualty event overwhelms trauma capacity, triggering emergency escalation across all surgical and critical care systems.',
    icon: '🚨',
    severity: 'critical',
    duration: '6h',
    tags: ['trauma', 'surgical', 'MCI', 'emergency'],
    frames: [
      frame('T+0 · Baseline', 'Routine operations', 'Normal operational tempo. Surgical schedule running on time.', {
        trafficSeverity: 3, respiratoryPositivity: 11, staffingAvailability: 88, erIntakeVolume: 38, icuCapacityPressure: 65, ambulanceLoad: 5, weatherSeverity: 0,
      }),
      frame('T+15min · MCI declared', 'Mass casualty event — notification received', 'Multi-vehicle incident reported. Mass casualty declared. Trauma teams activating. Ambulance surge beginning.', {
        trafficSeverity: 7, respiratoryPositivity: 11, staffingAvailability: 86, erIntakeVolume: 65, icuCapacityPressure: 67, ambulanceLoad: 12, weatherSeverity: 0,
      }),
      frame('T+30min · First wave arriving', 'High-acuity trauma presentations', 'First wave of critical patients arriving. Surgical bays at capacity. Trauma resuscitation bays overwhelmed.', {
        trafficSeverity: 9, respiratoryPositivity: 11, staffingAvailability: 82, erIntakeVolume: 85, icuCapacityPressure: 74, ambulanceLoad: 14, weatherSeverity: 0,
      }),
      frame('T+1h · Peak trauma load', 'Surgical capacity exhausted — escalation critical', 'All trauma bays occupied. ER in critical boarding failure. ICU pre-op holding at capacity.', {
        trafficSeverity: 10, respiratoryPositivity: 12, staffingAvailability: 75, erIntakeVolume: 96, icuCapacityPressure: 88, ambulanceLoad: 14, weatherSeverity: 0,
      }),
      frame('T+2h · Second wave + fatigue', 'Sustained surge — staff exhaustion building', 'Secondary presentations arriving. Surgical team fatigue critical. Blood bank on emergency allocation.', {
        trafficSeverity: 9, respiratoryPositivity: 12, staffingAvailability: 65, erIntakeVolume: 90, icuCapacityPressure: 93, ambulanceLoad: 13, weatherSeverity: 0,
      }),
      frame('T+3h · Controlled decompression', 'Transfer protocols activated', 'Stable patients diverted to partner network. Surgical throughput improving. First decompression wave.', {
        trafficSeverity: 7, respiratoryPositivity: 12, staffingAvailability: 70, erIntakeVolume: 78, icuCapacityPressure: 87, ambulanceLoad: 10, weatherSeverity: 0,
      }),
      frame('T+5h · Recovery phase', 'Acute phase concluding', 'Surgical schedule clearing. ICU beds stabilizing. Emergency protocols transitioning to recovery posture.', {
        trafficSeverity: 4, respiratoryPositivity: 12, staffingAvailability: 78, erIntakeVolume: 58, icuCapacityPressure: 80, ambulanceLoad: 6, weatherSeverity: 0,
      }),
      frame('T+6h · Normalization', 'Operational recovery', 'All critical patients in definitive care. Staffing fatigue monitoring in place. Debrief initiated.', {
        trafficSeverity: 3, respiratoryPositivity: 11, staffingAvailability: 84, erIntakeVolume: 44, icuCapacityPressure: 74, ambulanceLoad: 5, weatherSeverity: 0,
      }),
    ],
  },
];

export const REPLAY_SPEEDS = [
  { label: '0.5×', value: 6000 },
  { label: '1×',   value: 3000 },
  { label: '2×',   value: 1500 },
  { label: '4×',   value: 750  },
];

export const DEFAULT_REPLAY_SPEED = REPLAY_SPEEDS[1]; // 1×

// ─────────────────────────────────────────────────────────────────────────────
// DATASET-DRIVEN SCENARIOS
// These stubs have datasetDriven: true and no inline frames.
// ReplayControls detects this flag and fetches the real frames from:
//   GET /api/replay/scenario
// before calling useReplayEngine.load().
// ─────────────────────────────────────────────────────────────────────────────

export const DATASET_SCENARIOS = [
  {
    id:          'monsoon_respiratory_surge',
    name:        'Monsoon Respiratory Surge',
    description: 'Dataset-driven replay of a full Bengaluru monsoon surge day. Ambulance delays, ER boarding, ICU saturation, and respiratory escalation — resolved live from hospital timeline data.',
    icon:        '🌧',
    severity:    'critical',
    duration:    '16h',
    tags:        ['transport', 'respiratory', 'ICU', 'dataset'],
    datasetDriven: true,
    frames:      [], // populated at load time from /api/replay/scenario
  },
];

// Merged list: dataset-driven scenarios appear first.
export const ALL_SCENARIOS = [...DATASET_SCENARIOS, ...REPLAY_SCENARIOS];
