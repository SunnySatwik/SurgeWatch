/**
 * useReplayEngine
 *
 * Manages operational replay playback state.
 * Drives the centralized overrides via setOverrides — the full
 * intelligence ecosystem reacts automatically through useOperationalSync.
 *
 * Controls: play, pause, resume, reset, speed, step
 * Exposes:  replayState, controls, progress
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_OVERRIDES } from '../components/dashboard/OperationalControlPanel';
import { DEFAULT_REPLAY_SPEED } from '../data/replayScenarios';

export const REPLAY_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

export function useReplayEngine(setOverrides) {
  const [status, setStatus] = useState(REPLAY_STATUS.IDLE);
  const [scenario, setScenario] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [speed, setSpeed] = useState(DEFAULT_REPLAY_SPEED);
  const [savedScenarios, setSavedScenarios] = useState(() => {
    try {
      const raw = localStorage.getItem('surgewatch_saved_scenarios');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const timerRef = useRef(null);
  const scenarioRef = useRef(null);
  const frameIndexRef = useRef(0);
  const speedRef = useRef(DEFAULT_REPLAY_SPEED);

  // Keep refs in sync
  scenarioRef.current = scenario;
  frameIndexRef.current = frameIndex;
  speedRef.current = speed;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Apply frame at current index
  const applyFrame = useCallback((sc, idx) => {
    if (!sc || idx >= sc.frames.length) return;
    setOverrides(sc.frames[idx].overrides);
  }, [setOverrides]);

  // Advance one step
  const step = useCallback(() => {
    const sc = scenarioRef.current;
    const idx = frameIndexRef.current;
    if (!sc) return;

    const next = idx + 1;
    if (next >= sc.frames.length) {
      setStatus(REPLAY_STATUS.COMPLETED);
      clearTimer();
      return;
    }

    setFrameIndex(next);
    applyFrame(sc, next);
  }, [applyFrame]);

  // Auto-advance loop
  const scheduleNext = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      step();
      // Check if still playing after step (status won't have updated synchronously)
      if (frameIndexRef.current < (scenarioRef.current?.frames.length ?? 0) - 1) {
        scheduleNext();
      }
    }, speedRef.current.value);
  }, [step]);

  // Effect: when playing, keep scheduling
  useEffect(() => {
    if (status === REPLAY_STATUS.PLAYING) {
      scheduleNext();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [status, speed, scheduleNext]);

  // ── Controls ───────────────────────────────────────────────────────────────

  const load = useCallback((sc) => {
    clearTimer();
    setScenario(sc);
    setFrameIndex(0);
    setStatus(REPLAY_STATUS.IDLE);
    applyFrame(sc, 0);
  }, [applyFrame]);

  const play = useCallback(() => {
    if (!scenarioRef.current) return;
    // If completed, restart
    if (status === REPLAY_STATUS.COMPLETED) {
      setFrameIndex(0);
      applyFrame(scenarioRef.current, 0);
    }
    setStatus(REPLAY_STATUS.PLAYING);
  }, [status, applyFrame]);

  const pause = useCallback(() => {
    setStatus(REPLAY_STATUS.PAUSED);
  }, []);

  const resume = useCallback(() => {
    if (status === REPLAY_STATUS.PAUSED) {
      setStatus(REPLAY_STATUS.PLAYING);
    }
  }, [status]);

  const reset = useCallback(() => {
    clearTimer();
    setFrameIndex(0);
    setStatus(REPLAY_STATUS.IDLE);
    if (scenarioRef.current) {
      applyFrame(scenarioRef.current, 0);
    } else {
      setOverrides(DEFAULT_OVERRIDES);
    }
  }, [applyFrame, setOverrides]);

  const stepForward = useCallback(() => {
    if (status === REPLAY_STATUS.PLAYING) return; // Only manual step when paused/idle
    const sc = scenarioRef.current;
    const idx = frameIndexRef.current;
    if (!sc || idx >= sc.frames.length - 1) return;
    const next = idx + 1;
    setFrameIndex(next);
    applyFrame(sc, next);
    if (next === sc.frames.length - 1) setStatus(REPLAY_STATUS.COMPLETED);
  }, [status, applyFrame]);

  const stepBackward = useCallback(() => {
    if (status === REPLAY_STATUS.PLAYING) return;
    const idx = frameIndexRef.current;
    if (idx <= 0) return;
    const prev = idx - 1;
    setFrameIndex(prev);
    applyFrame(scenarioRef.current, prev);
    setStatus(REPLAY_STATUS.PAUSED);
  }, [status, applyFrame]);

  const eject = useCallback(() => {
    clearTimer();
    setScenario(null);
    setFrameIndex(0);
    setStatus(REPLAY_STATUS.IDLE);
    setOverrides(DEFAULT_OVERRIDES);
  }, [setOverrides]);

  // ── Save Current State ─────────────────────────────────────────────────────

  const saveCurrentState = useCallback((name, currentOverrides) => {
    const saved = {
      id: `custom_${Date.now()}`,
      name,
      savedAt: new Date().toISOString(),
      overrides: currentOverrides,
    };
    setSavedScenarios(prev => {
      const next = [saved, ...prev].slice(0, 10); // max 10 saved
      try { localStorage.setItem('surgewatch_saved_scenarios', JSON.stringify(next)); } catch {}
      return next;
    });
    return saved;
  }, []);

  const deleteSaved = useCallback((id) => {
    setSavedScenarios(prev => {
      const next = prev.filter(s => s.id !== id);
      try { localStorage.setItem('surgewatch_saved_scenarios', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const currentFrame = scenario?.frames?.[frameIndex] ?? null;
  const totalFrames = scenario?.frames?.length ?? 0;
  const progress = totalFrames > 0 ? (frameIndex / Math.max(totalFrames - 1, 1)) * 100 : 0;

  return {
    // State
    status,
    scenario,
    frameIndex,
    currentFrame,
    totalFrames,
    progress,
    speed,
    savedScenarios,

    // Controls
    controls: { load, play, pause, resume, reset, eject, stepForward, stepBackward, setSpeed },

    // Save
    saveCurrentState,
    deleteSaved,
  };
}
