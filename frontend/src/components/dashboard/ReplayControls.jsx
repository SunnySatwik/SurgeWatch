import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Pause, RotateCcw, StepForward, StepBack,
  ChevronDown, Bookmark, BookmarkCheck, Trash2,
  ChevronRight, Zap, Timer, X, Layers, Database, Loader
} from 'lucide-react';
import { REPLAY_SCENARIOS, REPLAY_SPEEDS, ALL_SCENARIOS } from '../../data/replayScenarios';
import { REPLAY_STATUS } from '../../hooks/useReplayEngine';
import { fetchReplayScenario } from '../../utils/replayService';

const SEVERITY_STYLES = {
  critical: 'text-red-700 bg-red-50 border-red-200',
  high:     'text-orange-700 bg-orange-50 border-orange-200',
  moderate: 'text-amber-700 bg-amber-50 border-amber-200',
  low:      'text-emerald-700 bg-emerald-50 border-emerald-200',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const ScenarioCard = ({ sc, isActive, onLoad, isLoadingDataset }) => (
  <button
    onClick={() => onLoad(sc)}
    disabled={isLoadingDataset && sc.datasetDriven}
    className={`w-full text-left p-3.5 rounded-xl border transition-all group
      ${isActive
        ? 'bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-500/10'
        : 'bg-white/60 border-slate-100 hover:border-slate-200 hover:bg-white/80'
      } ${isLoadingDataset && sc.datasetDriven ? 'opacity-70 cursor-wait' : ''}`}
  >
    <div className="flex items-start gap-3">
      <span className="text-lg leading-none mt-0.5">
        {isLoadingDataset && sc.datasetDriven ? '⏳' : sc.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-xs font-bold truncate ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
            {sc.name}
          </p>
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${SEVERITY_STYLES[sc.severity]}`}>
            {sc.severity}
          </span>
          {sc.datasetDriven && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
              <Database size={7} /> Live
            </span>
          )}
        </div>
        <p className="text-[9px] text-slate-400 leading-tight line-clamp-2">{sc.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            {sc.datasetDriven ? 'Dataset-driven' : `${sc.frames?.length ?? 0} frames`} · {sc.duration}
          </span>
          {sc.tags.slice(0, 2).map(t => (
            <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-[7px] font-black uppercase tracking-widest text-slate-500">{t}</span>
          ))}
        </div>
      </div>
      {isLoadingDataset && sc.datasetDriven
        ? <Loader size={12} className="shrink-0 mt-1 text-indigo-400 animate-spin" />
        : <ChevronRight size={12} className={`shrink-0 mt-1 transition-colors ${isActive ? 'text-indigo-500' : 'text-slate-300 group-hover:text-slate-500'}`} />
      }
    </div>
  </button>
);

const TimelineStrip = ({ frames, currentIndex, onJump }) => (
  <div className="flex gap-1 items-center overflow-x-auto pb-1 scrollbar-none">
    {frames.map((f, i) => {
      const isPast = i < currentIndex;
      const isCurrent = i === currentIndex;
      const isFuture = i > currentIndex;
      return (
        <button
          key={i}
          onClick={() => onJump(i)}
          title={`${f.time} — ${f.label}`}
          className="flex flex-col items-center gap-1 group shrink-0"
        >
          <div className={`w-2 h-2 rounded-full border transition-all
            ${isCurrent  ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)] scale-125' :
              isPast     ? 'bg-indigo-200 border-indigo-300' :
                           'bg-slate-100 border-slate-200 group-hover:bg-slate-300'}`}
          />
        </button>
      );
    })}
  </div>
);

const SaveCurrentModal = ({ overrides, onSave, onClose }) => {
  const [name, setName] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 gap-4"
    >
      <Bookmark size={24} className="text-indigo-500" />
      <p className="text-sm font-bold text-slate-800">Save Current Operational State</p>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())}
        placeholder="e.g. Afternoon Surge Baseline"
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <div className="flex gap-2 w-full">
        <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:border-slate-300 transition-all">Cancel</button>
        <button
          disabled={!name.trim()}
          onClick={() => onSave(name.trim())}
          className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all"
        >Save Snapshot</button>
      </div>
    </motion.div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const ReplayControls = ({ replay, overrides }) => {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState('presets'); // 'presets' | 'saved'
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [loadingDataset, setLoadingDataset] = useState(false);
  const [datasetError, setDatasetError] = useState(null);

  const { status, scenario, frameIndex, currentFrame, totalFrames, progress, speed, savedScenarios } = replay;
  const { load, play, pause, resume, reset, eject, stepForward, stepBackward, setSpeed, saveCurrentState, deleteSaved } = replay.controls;

  const isIdle      = status === REPLAY_STATUS.IDLE;
  const isPlaying   = status === REPLAY_STATUS.PLAYING;
  const isPaused    = status === REPLAY_STATUS.PAUSED;
  const isCompleted = status === REPLAY_STATUS.COMPLETED;
  const hasScenario = !!scenario;

  const handleSave = (name) => {
    saveCurrentState(name, overrides);
    setShowSaveModal(false);
  };

  // Dataset-driven scenarios are fetched from the backend before loading.
  // Static scenarios are loaded directly — no change to existing behavior.
  const handleLoadScenario = async (sc) => {
    if (sc.datasetDriven) {
      setLoadingDataset(true);
      setDatasetError(null);
      try {
        const res = await fetchReplayScenario();
        if (res.success && res.scenario) {
          load(res.scenario);
        } else {
          setDatasetError('Failed to load dataset scenario.');
        }
      } catch (err) {
        console.error('[ReplayControls] Dataset fetch error:', err);
        setDatasetError('Could not reach the replay API.');
      } finally {
        setLoadingDataset(false);
      }
    } else {
      load(sc);
    }
  };

  const handleJump = (idx) => {
    if (isPlaying) pause();
    const sc = scenario;
    if (!sc) return;
    replay.controls.reset();
    // Jump to frame by stepping: use internal direct override
    for (let i = 0; i <= idx; i++) {
      if (i === idx) {
        // Apply via the setOverrides chain — replay engine exposes this via load
      }
    }
    // Simple: just apply the frame overrides directly via eject+load won't work cleanly
    // Instead we expose a jumpTo — implemented by resetting and scheduling
    // For simplicity: apply overrides of that frame directly
    if (sc.frames[idx]) {
      const { controls: { eject: ej }, ..._ } = replay;
      // Access parent setOverrides via the load → eject trick isn't clean
      // Use the onJump callback from parent instead:
      replay._jumpTo?.(idx);
    }
  };

  // Posture badge
  const postureColor =
    isPlaying   ? 'text-indigo-700 bg-indigo-50 border-indigo-200' :
    isCompleted ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
    isPaused    ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  'text-slate-500 bg-slate-50 border-slate-200';
  const postureLabel =
    isPlaying   ? 'LIVE REPLAY' :
    isCompleted ? 'COMPLETED' :
    isPaused    ? 'PAUSED' :
    hasScenario ? 'LOADED' : 'STANDBY';

  return (
    <div className="vision-card glass-reflection relative overflow-hidden">
      {/* Playing pulse glow */}
      {isPlaying && (
        <motion.div
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-indigo-400/10 pointer-events-none"
        />
      )}

      {/* ── Header ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${isPlaying ? 'bg-indigo-100' : 'bg-slate-100'}`}>
            <Layers size={15} className={isPlaying ? 'text-indigo-600' : 'text-slate-500'} />
          </div>
          <div className="text-left">
            <p className="text-sm font-display font-bold text-slate-800">Operational Replay Engine</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">
              {hasScenario ? scenario.name : 'No scenario loaded'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${postureColor}`}>
            {postureLabel}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* ── Playback bar — always visible when loaded ── */}
      {hasScenario && (
        <div className="px-5 pb-3 relative z-10 border-t border-slate-100">
          {/* Progress track */}
          <div className="mt-3 mb-2 relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="flex items-center justify-between mb-2 gap-3">
            {/* Frame info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                {currentFrame?.time ?? '—'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                {currentFrame?.label ?? '—'}
              </p>
            </div>
            {/* Frame counter */}
            <span className="text-[9px] font-mono text-slate-400 shrink-0">
              {frameIndex + 1}/{totalFrames}
            </span>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            {/* Step back */}
            <button
              onClick={stepBackward}
              disabled={frameIndex === 0 || isPlaying}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-all"
            >
              <StepBack size={14} />
            </button>

            {/* Play/Pause/Resume */}
            {isPlaying ? (
              <button onClick={pause} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">
                <Pause size={11} /> Pause
              </button>
            ) : isCompleted ? (
              <button onClick={play} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">
                <Play size={11} className="fill-current" /> Replay
              </button>
            ) : isPaused ? (
              <button onClick={resume} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">
                <Play size={11} className="fill-current" /> Resume
              </button>
            ) : (
              <button onClick={play} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">
                <Play size={11} className="fill-current" /> Play
              </button>
            )}

            {/* Step forward */}
            <button
              onClick={stepForward}
              disabled={frameIndex >= totalFrames - 1 || isPlaying}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-all"
            >
              <StepForward size={14} />
            </button>

            {/* Reset */}
            <button onClick={reset} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all" title="Reset to frame 0">
              <RotateCcw size={13} />
            </button>

            {/* Speed */}
            <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              {REPLAY_SPEEDS.map(s => (
                <button
                  key={s.label}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all
                    ${speed.value === s.value ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Eject */}
            <button onClick={eject} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all" title="Unload scenario">
              <X size={13} />
            </button>
          </div>

          {/* Timeline dots */}
          {scenario?.frames && (
            <div className="mt-3">
              <TimelineStrip frames={scenario.frames} currentIndex={frameIndex} onJump={() => {}} />
            </div>
          )}

          {/* Frame annotation */}
          {currentFrame?.annotation && (
            <motion.div
              key={frameIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100"
            >
              <p className="text-[9px] text-slate-500 leading-relaxed break-words">{currentFrame.annotation}</p>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Expandable: Scenario picker + saved ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="replay-expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-slate-100 relative">
              <AnimatePresence>
                {showSaveModal && (
                  <SaveCurrentModal
                    overrides={overrides}
                    onSave={handleSave}
                    onClose={() => setShowSaveModal(false)}
                  />
                )}
              </AnimatePresence>

              {/* Tabs */}
              <div className="flex gap-1 mt-4 mb-4 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'presets', label: 'Scenarios' },
                  { id: 'saved',   label: `Saved (${savedScenarios.length})` },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                      ${tab === t.id ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'presets' && (
                <div className="space-y-2">
                  {datasetError && (
                    <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200">
                      <p className="text-[10px] font-bold text-red-600">{datasetError}</p>
                    </div>
                  )}
                  {ALL_SCENARIOS.map(sc => (
                    <ScenarioCard
                      key={sc.id}
                      sc={sc}
                      isActive={scenario?.id === sc.id}
                      onLoad={handleLoadScenario}
                      isLoadingDataset={loadingDataset}
                    />
                  ))}
                </div>
              )}

              {tab === 'saved' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Custom Snapshots</p>
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-all"
                    >
                      <Bookmark size={9} /> Save Current
                    </button>
                  </div>
                  {savedScenarios.length === 0 ? (
                    <div className="py-8 text-center">
                      <BookmarkCheck size={24} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">No saved snapshots yet.</p>
                      <p className="text-[9px] text-slate-300 mt-1">Configure the controls then save your operational state.</p>
                    </div>
                  ) : (
                    savedScenarios.map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-slate-100 group">
                        <BookmarkCheck size={14} className="text-indigo-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{s.name}</p>
                          <p className="text-[8px] text-slate-400 font-medium">
                            {new Date(s.savedAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteSaved(s.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReplayControls;
