/**
 * SurgeWatch AI Directives Engine
 * Derives a prioritized, causally-coherent set of operational directives
 * from the same intelligence state powering telemetry, unit disposition,
 * executive briefing, and scenario simulation.
 */

// ─── Directive Catalog ────────────────────────────────────────────────────────
// Each directive entry: { id, title, rationale, urgency, domain, impact }
// urgency: 'Critical' | 'High' | 'Moderate' | 'Low'
// domain: short operational category label

const DIRECTIVES = {

  // ── Transport / Ambulance ──────────────────────────────────────────────────
  AMB_REROUTE: {
    id: 'AMB_REROUTE',
    title: 'Activate Emergency Ambulance Rerouting',
    rationale: 'ORR/Silk Board gridlock is compressing inbound ETA beyond golden-hour thresholds. Bypass arterial corridors via Hosur Road alternate routing.',
    urgency: 'Critical',
    domain: 'Transport',
    impact: 'Reduces ambulance delay by 15–22 min',
  },
  AMB_SECONDARY_INTAKE: {
    id: 'AMB_SECONDARY_INTAKE',
    title: 'Open Secondary Intake Bay',
    rationale: 'Degraded ambulance telemetry indicates rising transit variance. Pre-staging secondary intake reduces ER compression on arrival.',
    urgency: 'High',
    domain: 'Transport',
    impact: 'Decouples arrival from triage queue',
  },
  DEFER_TRANSFERS: {
    id: 'DEFER_TRANSFERS',
    title: 'Defer Non-Critical Inter-Hospital Transfers',
    rationale: 'Active transport degradation increases diversion risk. Deferring outbound transfers preserves capacity for inbound surge.',
    urgency: 'High',
    domain: 'Transport',
    impact: 'Frees 2–4 critical-care transit slots',
  },
  DIVERSION_PROTOCOL: {
    id: 'DIVERSION_PROTOCOL',
    title: 'Initiate Regional Diversion Coordination',
    rationale: 'Sustained ER overload and ambulance compression have reached threshold for regional coordination. Notify district control.',
    urgency: 'Critical',
    domain: 'Transport',
    impact: 'Redistributes intake pressure system-wide',
  },

  // ── Respiratory / Isolation ───────────────────────────────────────────────
  ISO_EXPAND: {
    id: 'ISO_EXPAND',
    title: 'Expand Isolation Capacity',
    rationale: 'Isolation unit occupancy is crossing critical threshold. Convert Level 2 ward bays to respiratory isolation protocol immediately.',
    urgency: 'Critical',
    domain: 'Respiratory',
    impact: 'Adds 8–12 negative pressure equivalents',
  },
  RESP_OVERFLOW: {
    id: 'RESP_OVERFLOW',
    title: 'Prepare Respiratory Overflow Zone',
    rationale: 'Elevated viral syndromic pressure is straining isolation infrastructure. Stage cohort overflow areas to prevent ICU spillover.',
    urgency: 'High',
    domain: 'Respiratory',
    impact: 'Contains infectious patient clustering',
  },
  HALT_ELECTIVE: {
    id: 'HALT_ELECTIVE',
    title: 'Suspend Elective Admissions',
    rationale: 'Isolation saturation leaves no buffer for respiratory intake compression. Elective suspensions protect critical bed availability.',
    urgency: 'Critical',
    domain: 'Respiratory',
    impact: 'Recovers 10–15% inpatient bed capacity',
  },

  // ── ER / Boarding ─────────────────────────────────────────────────────────
  DISCHARGE_ACCELERATION: {
    id: 'DISCHARGE_ACCELERATION',
    title: 'Accelerate Inpatient Discharge Coordination',
    rationale: 'ER boarding failure is cascading from delayed discharges. Initiate early discharge protocol across General Ward and Pediatrics.',
    urgency: 'High',
    domain: 'Throughput',
    impact: 'Improves bed turnover by 20–30%',
  },
  REDUCE_ELECTIVE_IMAGING: {
    id: 'REDUCE_ELECTIVE_IMAGING',
    title: 'Suspend Non-Urgent Imaging Requests',
    rationale: 'Radiology queue backlog is delaying trauma workup. Restricting elective imaging preserves capacity for acute presentations.',
    urgency: 'Moderate',
    domain: 'Throughput',
    impact: 'Reduces radiology queue backlog by ~40%',
  },
  TRIAGE_AUGMENTATION: {
    id: 'TRIAGE_AUGMENTATION',
    title: 'Augment ER Triage Capacity',
    rationale: 'Triage queue saturation is compressing intake velocity. Deploy additional triage clinician to secondary bay.',
    urgency: 'High',
    domain: 'Throughput',
    impact: 'Increases triage throughput by 25%',
  },

  // ── Staffing ──────────────────────────────────────────────────────────────
  STANDBY_NURSING: {
    id: 'STANDBY_NURSING',
    title: 'Activate Standby Nursing Pool',
    rationale: 'Nurse-to-patient ratios are approaching fragile thresholds. Activating on-call nursing pool before ratio breach is critical.',
    urgency: 'Critical',
    domain: 'Staffing',
    impact: 'Restores minimum safe ratios within 45 min',
  },
  SHIFT_REINFORCEMENT: {
    id: 'SHIFT_REINFORCEMENT',
    title: 'Escalate Shift Reinforcement Protocols',
    rationale: 'Staffing telemetry indicates sub-optimal coverage for projected surge window. Extend current shift or recall relief rotation.',
    urgency: 'High',
    domain: 'Staffing',
    impact: 'Closes 2–3 critical staffing gaps',
  },
  SURGICAL_PAUSE: {
    id: 'SURGICAL_PAUSE',
    title: 'Pause Non-Emergency Surgical Activity',
    rationale: 'Staffing fragility combined with ER overflow creates risk of care quality degradation in surgical suites.',
    urgency: 'Moderate',
    domain: 'Staffing',
    impact: 'Reallocates 4–6 clinical staff to acute units',
  },

  // ── Regional / Infrastructure ─────────────────────────────────────────────
  BMTC_SYNC: {
    id: 'BMTC_SYNC',
    title: 'Coordinate BMTC and Dispatch Synchronization',
    rationale: 'BMTC transit data shows peak-hour density compounding ambulance routing variance. Real-time dispatch coordination reduces delay compounding.',
    urgency: 'Moderate',
    domain: 'Regional',
    impact: 'Reduces transit variance by 10–15 min',
  },
  ICU_STABILIZATION: {
    id: 'ICU_STABILIZATION',
    title: 'ICU Staffing and Bed Stabilization Protocol',
    rationale: 'ICU saturation window is critically compressed. Prioritize ICU staffing reinforcement and defer non-ICU-bound admissions.',
    urgency: 'Critical',
    domain: 'ICU',
    impact: 'Extends effective ICU window by 4–6h',
  },
  PHARMACY_RESTOCK: {
    id: 'PHARMACY_RESTOCK',
    title: 'Emergency Pharmacy Restock Authorization',
    rationale: 'Pharmacy inventory telemetry flagging low-stock alerts during surge conditions. Authorize emergency procurement.',
    urgency: 'Moderate',
    domain: 'Resources',
    impact: 'Prevents formulary gaps in 6h window',
  },

  // ── Stable / Nominal ──────────────────────────────────────────────────────
  ROUTINE_READINESS: {
    id: 'ROUTINE_READINESS',
    title: 'Maintain Routine Operational Readiness',
    rationale: 'Current conditions are within nominal parameters. Continue standard throughput optimization and bed management cadence.',
    urgency: 'Low',
    domain: 'Operational',
    impact: 'Baseline stability maintained',
  },
  CAPACITY_AUDIT: {
    id: 'CAPACITY_AUDIT',
    title: 'Conduct Proactive Capacity Audit',
    rationale: 'Stable operational window is optimal for capacity assessment. Audit bed turnover, staffing ratios, and supply inventory.',
    urgency: 'Low',
    domain: 'Operational',
    impact: 'Improves readiness posture for next surge window',
  },
};

// ─── Derivation Logic ─────────────────────────────────────────────────────────

/**
 * Core directive derivation function.
 * Returns a prioritized, deduplicated array of directive objects.
 *
 * @param {object} baseData  - Full intelligence engine output
 * @param {Array}  units     - Derived unit disposition array (from unitDispositionEngine)
 * @returns {Array}          - Ordered directive objects (max 5)
 */
export function deriveDirectives(baseData, units = []) {
  if (!baseData) return [DIRECTIVES.ROUTINE_READINESS];

  const conditions = baseData?.intelligence?.conditions ?? {};
  const escalation = baseData?.intelligence?.escalation ?? 'Stable';
  const metrics = baseData?.metrics ?? {};

  const {
    ambulanceFlow,
    erCongestion,
    isolationCapacity,
    respiratoryPressure,
    staffingStability,
    traumaVelocity,
    triagePressure,
    bedTurnover,
  } = conditions;

  const { osi = 32, delayRisk = 10, icuWindow = '> 24h' } = metrics;

  // Unit stress signals
  const erUnit = units.find(u => u.name === 'Emergency');
  const icuUnit = units.find(u => u.name === 'ICU');
  const radUnit = units.find(u => u.name === 'Radiology');

  const erCritical = erUnit?.status === 'Critical' || erUnit?.status === 'Extreme';
  const icuCritical = icuUnit?.status === 'Critical' || icuUnit?.status === 'Extreme';
  const radBacklogged = radUnit?.status === 'Critical' || radUnit?.status === 'Warning';

  // Build weighted directive candidate list
  const candidates = [];
  const add = (directive, weight) => candidates.push({ directive, weight });

  // ── Transport signals ────────────────────────────────────────────────────
  if (ambulanceFlow === 'critical intake compression') {
    add(DIRECTIVES.AMB_REROUTE, 100);
    add(DIRECTIVES.DIVERSION_PROTOCOL, 90);
    add(DIRECTIVES.DEFER_TRANSFERS, 70);
  } else if (ambulanceFlow === 'degraded') {
    add(DIRECTIVES.AMB_SECONDARY_INTAKE, 80);
    add(DIRECTIVES.DEFER_TRANSFERS, 55);
    add(DIRECTIVES.BMTC_SYNC, 40);
  }

  // ── ER / Boarding signals ────────────────────────────────────────────────
  if (erCongestion === 'critical boarding failure' || erCritical) {
    add(DIRECTIVES.DISCHARGE_ACCELERATION, 85);
    add(DIRECTIVES.TRIAGE_AUGMENTATION, 80);
    add(DIRECTIVES.HALT_ELECTIVE, 65);
  } else if (erCongestion === 'high boarding pressure' || triagePressure === 'sustained strain') {
    add(DIRECTIVES.TRIAGE_AUGMENTATION, 60);
    add(DIRECTIVES.DISCHARGE_ACCELERATION, 55);
  }

  // ── Respiratory / Isolation signals ─────────────────────────────────────
  if (isolationCapacity === 'exhausted') {
    add(DIRECTIVES.ISO_EXPAND, 95);
    add(DIRECTIVES.HALT_ELECTIVE, 85);
    add(DIRECTIVES.RESP_OVERFLOW, 75);
  } else if (isolationCapacity === 'strained' || respiratoryPressure === 'elevated syndromic pressure') {
    add(DIRECTIVES.RESP_OVERFLOW, 65);
    add(DIRECTIVES.ISO_EXPAND, 50);
  }

  // ── ICU signals ──────────────────────────────────────────────────────────
  if (icuCritical || icuWindow === '< 4h' || icuWindow === '< 8h') {
    add(DIRECTIVES.ICU_STABILIZATION, 90);
    if (staffingStability === 'fragile ratios') {
      add(DIRECTIVES.STANDBY_NURSING, 85);
    }
  }

  // ── Staffing signals ─────────────────────────────────────────────────────
  if (staffingStability === 'fragile ratios') {
    add(DIRECTIVES.STANDBY_NURSING, 88);
    add(DIRECTIVES.SHIFT_REINFORCEMENT, 72);
    if (erCongestion !== 'nominal' || erCritical) {
      add(DIRECTIVES.SURGICAL_PAUSE, 50);
    }
  }

  // ── Trauma signals ───────────────────────────────────────────────────────
  if (traumaVelocity === 'high-velocity volatility') {
    add(DIRECTIVES.TRIAGE_AUGMENTATION, 75);
    if (radBacklogged) add(DIRECTIVES.REDUCE_ELECTIVE_IMAGING, 65);
  } else if (traumaVelocity === 'elevated presentation rate' && radBacklogged) {
    add(DIRECTIVES.REDUCE_ELECTIVE_IMAGING, 50);
  }

  // ── Regional context ─────────────────────────────────────────────────────
  if (ambulanceFlow !== 'stable') {
    add(DIRECTIVES.BMTC_SYNC, 35);
  }

  // ── Resource signals ─────────────────────────────────────────────────────
  if (osi > 60) {
    add(DIRECTIVES.PHARMACY_RESTOCK, 40);
  }

  // ── Stable fallback ──────────────────────────────────────────────────────
  if (candidates.length === 0 || escalation === 'Stable') {
    add(DIRECTIVES.ROUTINE_READINESS, 20);
    add(DIRECTIVES.CAPACITY_AUDIT, 15);
  }

  // ── Sort by weight, deduplicate, cap at 5 ────────────────────────────────
  const seen = new Set();
  const sorted = candidates
    .sort((a, b) => b.weight - a.weight)
    .filter(({ directive }) => {
      if (seen.has(directive.id)) return false;
      seen.add(directive.id);
      return true;
    })
    .map(({ directive }) => directive);

  // During crisis escalation, filter out low-priority informational directives
  const crisisMode = escalation === 'Regional Emergency Coordination' || escalation === 'Critical Incident Mode';
  const filtered = crisisMode
    ? sorted.filter(d => d.urgency !== 'Low')
    : sorted;

  return filtered.slice(0, 5);
}
