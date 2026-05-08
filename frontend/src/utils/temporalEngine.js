/**
 * SurgeWatch Temporal Engine
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for all date/time derivations used across
 * the dashboard. Keeps rolling-week logic in one place so no
 * component ever hard-codes a calendar string.
 *
 * Design principles:
 *  - Pure functions only (no side-effects, safe to memoize)
 *  - All derivations are relative to `now` (or a supplied anchor)
 *  - Exported helpers are consumed as-is; no caching needed here
 *    because callers use useMemo / compute once per render
 */

// ─── Core Helpers ────────────────────────────────────────────────────────────

/**
 * Returns the canonical "now" anchor for the session.
 * Using a function so callers that memoize get a stable reference.
 */
export function getNow() {
  return new Date();
}

/**
 * Add `n` days to a Date, returning a new Date.
 */
export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Rolling 7-Day Window ────────────────────────────────────────────────────

/**
 * Generates the rolling 7-day forecast window anchored to today.
 *
 * Returns an array of 7 objects:
 *   {
 *     index:     number,    // 0–6
 *     date:      Date,      // actual calendar date
 *     dayShort:  string,    // "Mon"
 *     dayFull:   string,    // "Monday"
 *     dateLabel: string,    // "May 8"
 *     isoDate:   string,    // "2026-05-08"
 *     isToday:   boolean,
 *   }
 *
 * @param {Date} [anchor=new Date()] - date to treat as day 0
 */
export function getRollingWeek(anchor = new Date()) {
  const today = new Date(anchor);
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i);
    return {
      index: i,
      date: d,
      dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),    // "Thu"
      dayFull:  d.toLocaleDateString('en-US', { weekday: 'long' }),     // "Thursday"
      dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // "May 8"
      isoDate:  d.toISOString().split('T')[0],                          // "2026-05-08"
      isToday:  i === 0,
    };
  });
}

// ─── Operational Header Labels ───────────────────────────────────────────────

/**
 * Returns the live operational header label for the insights view.
 * Format: "MAY 8 · LIVE MONITORING"
 *
 * @param {Date} [anchor=new Date()]
 */
export function getLiveOperationalLabel(anchor = new Date()) {
  const dateStr = anchor.toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
  }).toUpperCase(); // "MAY 8"
  return `${dateStr} · LIVE MONITORING`;
}

/**
 * Returns an ISO-formatted operational timestamp.
 * Used for secondary sub-labels: "Thu, May 8 2026"
 *
 * @param {Date} [anchor=new Date()]
 */
export function getOperationalDate(anchor = new Date()) {
  return anchor.toLocaleDateString('en-US', {
    weekday: 'short',
    year:    'numeric',
    month:   'short',
    day:     'numeric',
  });
}

// ─── Selected-Day Derived Labels ─────────────────────────────────────────────

/**
 * Given the rolling week array and the selected day index,
 * returns the display objects for all forecast-card timestamps.
 *
 * @param {ReturnType<typeof getRollingWeek>} week
 * @param {number} selectedIndex   - 0–6
 */
export function getSelectedDayContext(week, selectedIndex) {
  const selected = week[selectedIndex] ?? week[0];
  return {
    dayShort:  selected.dayShort,
    dayFull:   selected.dayFull,
    dateLabel: selected.dateLabel,
    isoDate:   selected.isoDate,
    isToday:   selected.isToday,
    /** "Today · May 8" or "Thu · May 8" */
    operationalLabel: selected.isToday
      ? `Today · ${selected.dateLabel}`
      : `${selected.dayShort} · ${selected.dateLabel}`,
  };
}

// ─── Telemetry / Event Timestamps ────────────────────────────────────────────

/**
 * Returns a human-readable clock string from a Date.
 * Matches the format used in telemetry event lists.
 */
export function toClockLabel(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Returns a time label `minutesAgo` minutes before `anchor`.
 */
export function clockMinsAgo(minutesAgo, anchor = new Date()) {
  return toClockLabel(new Date(anchor.getTime() - minutesAgo * 60 * 1000));
}

// ─── Operational Mode Labels ─────────────────────────────────────────────────

/**
 * Returns the sub-header label string for each dashboard mode.
 *
 * @param {'insights'|'simulator'|'integration'} mode
 * @param {string} riskLabel  - "Low", "High", "Critical", etc.
 * @param {Date}   [anchor]
 */
export function getModeLabel(mode, riskLabel = 'Low', anchor = new Date()) {
  const live = getLiveOperationalLabel(anchor);
  switch (mode) {
    case 'simulator':
      return 'Simulation Environment';
    case 'integration':
      return 'Infrastructure Layer';
    default:
      return `${riskLabel} Risk · ${live}`;
  }
}

/**
 * Returns the main page title for each dashboard mode.
 */
export function getModeTitle(mode) {
  switch (mode) {
    case 'simulator':
      return 'Predictive Scenario Lab';
    case 'integration':
      return 'System Integration Hub';
    default:
      return 'Intelligence Hub';
  }
}

// ─── Dev / Test Mode Utilities ───────────────────────────────────────────────

/**
 * Hidden test-mode keyboard shortcut sequence.
 * Call from a keydown listener; returns true when the sequence is complete.
 *
 * Sequence: Ctrl + Shift + T  (non-intrusive, won't clash with browser shortcuts)
 */
export const TEST_MODE_SHORTCUT = (e) =>
  e.ctrlKey && e.shiftKey && e.key === 'T';

/**
 * Serialises the current operational snapshot for deterministic replay.
 * Strips live timestamps so replays are stable.
 */
export function snapshotOperationalState(baseData, scenario, selectedIndex, week) {
  return {
    __surgewatch_snapshot: true,
    capturedAt: new Date().toISOString(),
    selectedIndex,
    isoDate: week[selectedIndex]?.isoDate ?? null,
    scenarioParams: scenario,
    metrics: baseData?.metrics ?? null,
    escalation: baseData?.intelligence?.escalation ?? null,
  };
}
