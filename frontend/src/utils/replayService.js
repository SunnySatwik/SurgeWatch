/**
 * replayService.js
 *
 * Frontend API client for the /api/replay backend endpoints.
 * Provides the dataset-driven scenario fetch used by useDatasetReplay.
 */

const REPLAY_BASE = '/api/replay';

/**
 * fetchReplayTimestamps()
 * Returns the list of all available HH:MM timestamps from the timeline datasets.
 */
export async function fetchReplayTimestamps() {
  const res = await fetch(`${REPLAY_BASE}/timestamps`);
  if (!res.ok) throw new Error(`Replay timestamps error: ${res.statusText}`);
  return res.json();
}

/**
 * fetchReplayState(timestamp)
 * Resolves a single operational snapshot for a given "HH:MM" timestamp.
 *
 * @param  {string} timestamp  - e.g. "14:00"
 * @returns {Promise<object>}   Backend snapshot object
 */
export async function fetchReplayState(timestamp) {
  const res = await fetch(`${REPLAY_BASE}/state/${encodeURIComponent(timestamp)}`);
  if (!res.ok) throw new Error(`Replay state error: ${res.statusText}`);
  return res.json();
}

/**
 * fetchReplayScenario()
 * Returns the complete Monsoon Respiratory Surge dataset-driven scenario,
 * already in { id, name, frames: [{ time, label, annotation, overrides, _meta }] }
 * shape — directly consumable by useReplayEngine.controls.load().
 */
export async function fetchReplayScenario() {
  const res = await fetch(`${REPLAY_BASE}/scenario`);
  if (!res.ok) throw new Error(`Replay scenario error: ${res.statusText}`);
  return res.json();
}
