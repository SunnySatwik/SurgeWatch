/**
 * SurgeWatch Context-Aware Telemetry Engine
 * Generates operationally-coherent telemetry events aligned with the
 * same intelligence state that drives the Executive Briefing and Scenario Lab.
 */

// ─── Categorized Event Pools ───────────────────────────────────────────────────

const EVENT_POOLS = {
  transport: [
    { text: "ORR congestion increasing ambulance ETA variance", type: "warning" },
    { text: "Silk Board corridor gridlock: ambulance diversion activated", type: "warning" },
    { text: "Ambulance telemetry feed reporting elevated transit delays", type: "warning" },
    { text: "Clustered ambulance intake wave approaching ER bay", type: "warning" },
    { text: "Electronic City flyover congestion: 22+ min inbound delay logged", type: "warning" },
    { text: "BMTC transit data showing peak-hour density spike", type: "warning" },
    { text: "Ambulance routing telemetry nominal — all units responding", type: "success" },
    { text: "Transit delay risk stabilizing after Silk Board congestion clear", type: "success" },
  ],
  respiratory: [
    { text: "Respiratory isolation unit occupancy crossing 80% threshold", type: "warning" },
    { text: "Viral syndromic cluster detected via lab positivity feed", type: "warning" },
    { text: "Isolation bay census reconciliation triggered by surge protocol", type: "info" },
    { text: "ICD-10 respiratory code frequency anomaly — H7 escalation flagged", type: "warning" },
    { text: "Negative pressure room capacity at critical threshold", type: "warning" },
    { text: "Lab positivity feed: respiratory positivity rate exceeds 18%", type: "warning" },
    { text: "Isolation unit telemetry sync completed via HL7 bridge", type: "success" },
  ],
  staffing: [
    { text: "Staffing roster sync flagging shift gap in Level-2 ICU", type: "warning" },
    { text: "Nurse-to-patient ratio anomaly: Level-3 ward below threshold", type: "warning" },
    { text: "On-call escalation protocol triggered — surge staffing requested", type: "warning" },
    { text: "Staffing roster API polling completed: shift change processed", type: "info" },
    { text: "Surge staff deployment acknowledged: 12 additional units active", type: "success" },
    { text: "Pharmacy inventory low-stock alert: paracetamol IV supply critical", type: "warning" },
  ],
  infrastructure: [
    { text: "HL7 bridge connection heartbeat confirmed", type: "success" },
    { text: "EHR database replication lag detected — reconciliation pending", type: "warning" },
    { text: "EHR patient census reconciled via FHIR sync", type: "success" },
    { text: "Bed management feed sync completed — 214 active records updated", type: "success" },
    { text: "ICD-10 code mapping cache refreshed", type: "info" },
    { text: "FHIR patient resource bundle sync: 98.4% integrity confirmed", type: "success" },
    { text: "Edge failover node tested — redundancy confirmed active", type: "info" },
    { text: "API gateway latency spike detected on EHR feed", type: "warning" },
    { text: "API gateway latency normalized — EHR feed recovering", type: "success" },
  ],
  telemetry: [
    { text: "Telemetry packet loss recovered — signal restored", type: "success" },
    { text: "Signal redundancy active — primary node replicating to edge", type: "info" },
    { text: "Telemetry ingestion buffer at 74% — monitoring elevated load", type: "warning" },
    { text: "Pharmacy inventory feed degraded — retry backoff active", type: "warning" },
    { text: "Pharmacy inventory feed restored after 3-minute degradation", type: "success" },
    { text: "Lab positivity sync latency spike: 340ms — anomaly logged", type: "warning" },
    { text: "Telemetry data compression ratio nominal — pipeline healthy", type: "info" },
  ],
  regional: [
    { text: "Monsoon severity model re-calibrated: Indiranagar underpass monitoring active", type: "info" },
    { text: "Rainfall telemetry: 14mm/hr sustained in Hebbal — flood risk elevated", type: "warning" },
    { text: "BMTC fleet tracking delayed — 6 routes suspended (ORR waterlogging)", type: "warning" },
    { text: "Chinnaswamy event overflow: minor trauma cluster presentations rising", type: "warning" },
    { text: "MG Road crowd density exceeding threshold — trauma intake projection updated", type: "warning" },
    { text: "Regional public health feed: district respiratory trend anomaly confirmed", type: "warning" },
    { text: "Bengaluru weather API: storm severity downgraded to moderate", type: "info" },
    { text: "Regional viral trend data synced from BBMP public health node", type: "info" },
  ],
  recovery: [
    { text: "ICU occupancy sync completed via HL7 — census nominal", type: "success" },
    { text: "ER boarding pressure decreasing — throughput improving", type: "success" },
    { text: "Ambulance ETA variance stabilizing — congestion clearing", type: "success" },
    { text: "Edge node failover completed successfully — primary restored", type: "success" },
    { text: "All systems operational — no active degradations logged", type: "info" },
    { text: "Staffing ratios normalized after surge deployment", type: "success" },
  ],
};

// ─── Causal Chain Sequences ─────────────────────────────────────────────────────
// Maps a triggering event text fragment to a probable follow-up event pool
const CAUSAL_CHAINS = {
  "ambulance ETA variance": "transport",
  "Silk Board corridor": "transport",
  "isolation unit occupancy": "respiratory",
  "viral syndromic cluster": "respiratory",
  "shift gap": "staffing",
  "nurse-to-patient ratio": "staffing",
  "EHR database replication lag": "infrastructure",
  "telemetry packet loss": "telemetry",
  "rainfall telemetry": "regional",
  "Chinnaswamy event overflow": "regional",
  "BMTC fleet tracking": "regional",
};

// ─── State → Weight Table ───────────────────────────────────────────────────────
/**
 * Given the current operational conditions, returns a weight map
 * for each event category. Higher weight = higher probability of selection.
 */
function deriveWeights(conditions, escalation) {
  const weights = {
    transport: 1,
    respiratory: 1,
    staffing: 1,
    infrastructure: 2, // always baseline-present
    telemetry: 2,      // always baseline-present
    regional: 1,
    recovery: 3,       // default — stable systems recover often
  };

  const { ambulanceFlow, isolationCapacity, staffingStability, erCongestion, respiratoryPressure } = conditions;

  // Transport disruption
  if (ambulanceFlow === "critical intake compression") {
    weights.transport = 8;
    weights.recovery = 0;
  } else if (ambulanceFlow === "degraded") {
    weights.transport = 5;
    weights.regional = 3;
    weights.recovery = 1;
  }

  // Respiratory / isolation pressure
  if (isolationCapacity === "exhausted") {
    weights.respiratory = 8;
    weights.recovery = 0;
  } else if (isolationCapacity === "strained" || respiratoryPressure === "elevated syndromic pressure") {
    weights.respiratory = 5;
  }

  // Staffing strain
  if (staffingStability === "fragile ratios") {
    weights.staffing = 6;
    weights.recovery = 1;
  } else if (staffingStability === "reinforced surge posture") {
    weights.staffing = 1;
    weights.recovery = 5;
  }

  // ER congestion
  if (erCongestion === "critical boarding failure") {
    weights.infrastructure = 5;
    weights.telemetry = 4;
    weights.recovery = 0;
  }

  // Escalation posture dampens recovery events
  if (escalation === "Regional Emergency Coordination" || escalation === "Critical Incident Mode") {
    weights.recovery = Math.max(0, weights.recovery - 2);
    weights.transport = Math.max(weights.transport, 4);
  }

  return weights;
}

/**
 * Weighted random selection from a weight map.
 */
function weightedPickCategory(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let rand = Math.random() * total;
  for (const [category, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return category;
  }
  return entries[entries.length - 1][0];
}

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * Generates a single context-aware telemetry event.
 *
 * @param {object} operationalState  - intelligence engine output (conditions, escalation, metrics)
 * @param {object|null} lastEvent    - the most recently generated event (for causal chaining)
 * @returns {{ text: string, type: string }}
 */
export function generateTelemetryEvent(operationalState, lastEvent) {
  const conditions = operationalState?.intelligence?.conditions ?? {
    ambulanceFlow: "stable",
    isolationCapacity: "available",
    staffingStability: "adequate",
    erCongestion: "nominal",
    respiratoryPressure: "stable",
  };
  const escalation = operationalState?.intelligence?.escalation ?? "Stable";

  const weights = deriveWeights(conditions, escalation);

  // Causal chaining: if last event text matches a trigger, bias toward its sequel category
  let category;
  if (lastEvent) {
    const triggerKey = Object.keys(CAUSAL_CHAINS).find(k => lastEvent.text.toLowerCase().includes(k.toLowerCase()));
    if (triggerKey && Math.random() < 0.45) {
      // 45% chance to follow the causal chain
      category = CAUSAL_CHAINS[triggerKey];
    }
  }

  if (!category) {
    category = weightedPickCategory(weights);
  }

  const pool = EVENT_POOLS[category];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generates a seed set of initial events calibrated to current state.
 * Produces events from the most relevant categories first.
 */
export function generateInitialEvents(operationalState) {
  const conditions = operationalState?.intelligence?.conditions ?? {};
  const escalation = operationalState?.intelligence?.escalation ?? "Stable";
  const weights = deriveWeights(conditions, escalation);
  const now = new Date();

  const events = [];
  let lastEvent = null;

  for (let i = 0; i < 6; i++) {
    const template = generateTelemetryEvent(operationalState, lastEvent);
    const t = new Date(now - (6 - i) * 180000); // space ~3 mins apart going backward
    events.push({
      id: i + 1,
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text: template.text,
      type: template.type,
    });
    lastEvent = template;
  }

  return events;
}
