import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, LayoutDashboard,
  Home, User, Beaker,
  AlertTriangle, ArrowUpRight, Sparkles, Database,
  Shield, Gauge, Radio
} from 'lucide-react';
import { DASHBOARD_DATA as INITIAL_DATA } from '../../data/data';
import { REPLAY_STATUS } from '../../hooks/useReplayEngine';
import {
  getRollingWeek,
  getSelectedDayContext,
  getLiveOperationalLabel,
  getModeTitle,
  TEST_MODE_SHORTCUT,
} from '../../utils/temporalEngine';
import { simulateScenario } from '../../utils/intelligenceService';
import { DEFAULT_OVERRIDES } from './OperationalControlPanel';
import { useOperationalSync } from '../../hooks/useOperationalSync';
import { useReplayEngine } from '../../hooks/useReplayEngine';
import ForecastChart from './ForecastChart';
import Recommendations from './Recommendations';
import DepartmentSection from './DepartmentSection';
import WeatherWidget from './WeatherWidget';
import ScenarioSimulator from './ScenarioSimulator';
import IntegrationHub from './IntegrationHub';
import OperationalReadiness from './OperationalReadiness';

const riskConfig = {
  Critical: { badge: 'risk-badge-critical', glow: 'risk-critical', dot: 'bg-red-500' },
  High: { badge: 'risk-badge-high', glow: '', dot: 'bg-orange-400' },
  Moderate: { badge: 'risk-badge-moderate', glow: '', dot: 'bg-amber-400' },
  Medium: { badge: 'risk-badge-moderate', glow: '', dot: 'bg-amber-400' },
  Low: { badge: 'risk-badge-low', glow: '', dot: 'bg-emerald-500' },
};

const Dashboard = ({ onBack }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState('insights');
  const containerRef = useRef(null);
  const [dashboardData, setDashboardData] = useState(INITIAL_DATA);
  const [baseData, setBaseData] = useState(null);
  const [testMode, setTestMode] = useState(false);

  // Centralized override state — lifted here for platform-wide propagation
  const [overrides, setOverrides] = useState(DEFAULT_OVERRIDES);
  const { scenario, operationalSignal } = useOperationalSync(overrides);
  const replay = useReplayEngine(setOverrides);

  // ── Rolling 7-day window derived once per render ──
  const rollingWeek = useMemo(() => getRollingWeek(), []);
  const selectedDayCtx = useMemo(
    () => getSelectedDayContext(rollingWeek, selectedDayIndex),
    [rollingWeek, selectedDayIndex]
  );
  const liveLabel = useMemo(() => getLiveOperationalLabel(), []);

  // ── Dev test mode shortcut: Ctrl+Shift+T ──
  useEffect(() => {
    const handler = (e) => {
      if (TEST_MODE_SHORTCUT(e)) {
        e.preventDefault();
        setTestMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    fetch('/api/forecast')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDashboardData(data);
        }
      })
      .catch(err => console.error('Failed to fetch ML data:', err));
  }, []);

  useEffect(() => {
    const dataIndex = dashboardData.length > 0 ? selectedDayIndex % dashboardData.length : 0;
    const raw = dashboardData?.[dataIndex] ?? dashboardData?.[0];
    if (raw) {
      // Baseline always runs with active override scenario so insights stay coherent
      simulateScenario(raw, scenario)
        .then(data => setBaseData(data))
        .catch(err => console.error('Failed to simulate baseline:', err));
    }
  }, [selectedDayIndex, dashboardData, scenario]);

  // ── Unified BaseData ──────────────────────────────────────────────────────
  // Merge live operationalSignal intelligence (from override controls) on top
  // of the backend-derived baseData. This makes ALL downstream engines
  // (Insights, Unit Pressure, Executive Briefing, etc.) consume a single
  // coherent operational truth. When overrides are at baseline, the merge is
  // a no-op since intelligenceConditions will reflect the same nominal state.
  const unifiedBaseData = useMemo(() => {
    if (!baseData) return null;
    if (!operationalSignal?.intelligenceConditions) return baseData;
    return {
      ...baseData,
      intelligence: {
        ...(baseData.intelligence ?? {}),
        conditions: {
          ...(baseData.intelligence?.conditions ?? {}),
          ...operationalSignal.intelligenceConditions,
        },
        escalation: operationalSignal.intelligenceConditions.escalation
          ?? baseData.intelligence?.escalation,
      },
      metrics: {
        ...(baseData.metrics ?? {}),
        ...operationalSignal.intelligenceMetrics,
      },
    };
  }, [baseData, operationalSignal?.intelligenceConditions, operationalSignal?.intelligenceMetrics]);


  // Map rolling week onto dashboard data (cycles through available ML days)
  const DAYS = rollingWeek.map((dayCtx, i) => ({
    label: dayCtx.dayShort,
    dateLabel: dayCtx.dateLabel,
    isToday: dayCtx.isToday,
    index: i,
    // ML data index wraps if fewer than 7 days returned from backend
    dataIndex: i % dashboardData.length,
  }));

  const risk = riskConfig[unifiedBaseData?.risk ?? baseData?.risk] ?? riskConfig.Low;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen flex overflow-hidden font-sans relative bg-vision-bg"
    >
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="ambient-glow glow-lavender w-[900px] h-[900px] -top-48 -left-48 opacity-60"
          style={{ transform: `translate(${mousePos.x * -40}px, ${mousePos.y * -40}px)` }} />
        <div className="ambient-glow glow-indigo w-[600px] h-[600px] bottom-0 right-0 opacity-40"
          style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }} />
        <div className="ambient-glow glow-peach w-[400px] h-[400px] top-1/2 left-1/2 opacity-20" />
        {/* Escalation pulse — appears when operational signal is critical */}
        {operationalSignal?.operationalState?.escalationRisk === 'critical' && (
          <motion.div
            animate={{ opacity: [0, 0.06, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-red-500"
          />
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-[72px] md:w-64 m-4 mr-0 vision-glass rounded-[2rem] flex flex-col items-center md:items-start py-8 z-50 relative shrink-0">
        {/* Logo */}
        <button
          onClick={onBack}
          className="px-5 mb-10 flex items-center gap-3 w-full justify-center md:justify-start group cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 group-hover:scale-105 transition-transform">
            <Activity className="text-white w-4 h-4" />
          </div>
          <span className="text-lg font-display font-bold text-slate-800 tracking-tight hidden md:block">SurgeWatch</span>
        </button>

        <nav className="flex-1 w-full px-3 space-y-1.5">
          <NavItem icon={LayoutDashboard} label="Insights" seq="01" active={mode === 'insights'} onClick={() => setMode('insights')} />
          <NavItem icon={Beaker} label="Scenario Lab" seq="02" active={mode === 'simulator'} onClick={() => setMode('simulator')} />
          <NavItem icon={Database} label="Integration Hub" seq="03" active={mode === 'integration'} onClick={() => setMode('integration')} />
          <NavItem icon={Gauge} label="Readiness" seq="04" active={mode === 'readiness'}
            onClick={() => setMode('readiness')}
            alert={operationalSignal?.operationalState?.escalationRisk === 'critical'}
          />
        </nav>

        {/* AI Status pill */}
        <div className="hidden md:flex px-5 mb-4 w-full">
          <div className={`w-full px-4 py-3 rounded-2xl border flex items-center gap-3 transition-colors 
            ${mode === 'simulator' ? 'bg-amber-50 border-amber-100' :
              mode === 'integration' ? 'bg-blue-50 border-blue-100' :
                mode === 'readiness' ? 'bg-purple-50 border-purple-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className="relative w-2.5 h-2.5">
              <div className={`absolute inset-0 rounded-full animate-ping 
                ${mode === 'simulator' ? 'bg-amber-500' : mode === 'integration' ? 'bg-blue-500' :
                  mode === 'readiness' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
              <div className={`w-2.5 h-2.5 rounded-full relative 
                ${mode === 'simulator' ? 'bg-amber-500' : mode === 'integration' ? 'bg-blue-500' :
                  mode === 'readiness' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest 
                ${mode === 'simulator' ? 'text-amber-700' : mode === 'integration' ? 'text-blue-700' :
                  mode === 'readiness' ? 'text-purple-700' : 'text-emerald-700'}`}>
                {mode === 'simulator' ? 'Sim Engine' : mode === 'integration' ? 'Data Sync' :
                  mode === 'readiness' ? 'Ops Readiness' : 'Model Live'}
              </p>
              <p className={`text-[9px] font-medium 
                ${mode === 'simulator' ? 'text-amber-600' : mode === 'integration' ? 'text-blue-600' :
                  mode === 'readiness' ? 'text-purple-600' : 'text-emerald-600'}`}>
                {mode === 'integration' ? 'All systems active' :
                  mode === 'readiness' ? 'Risk assessment live' : `v2.4 · ${baseData?.confidence}% acc.`}
              </p>
            </div>
          </div>
        </div>

        <div className="px-3 w-full border-t border-black/5 pt-3">
          <button onClick={onBack}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-slate-800 hover:bg-black/5 rounded-2xl transition-all text-sm font-semibold group">
            <Home size={18} className="group-hover:text-blue-600 transition-colors" />
            <span className="hidden md:block">Back to Home</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 h-screen overflow-y-auto z-10 p-4 flex flex-col min-w-0">

        {/* ── Header ── */}
        <header className="vision-glass rounded-[2rem] px-6 py-4 flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-xl font-display font-bold text-slate-800 tracking-tight">
                {getModeTitle(mode)}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {mode === 'insights' ? liveLabel :
                    mode === 'simulator' ? 'Scenario Modeling Active' :
                      mode === 'readiness' ? 'Operational Command Layer' :
                        'Infrastructure Layer'}
                </span>
                <span className="text-slate-200">·</span>
                {/* Live escalation posture — shows across all modes when overrides active */}
                {operationalSignal && operationalSignal.operationalState.escalationRisk !== 'low' ? (
                  <motion.span
                    key={operationalSignal.operationalState.escalationRisk}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border
                      ${operationalSignal.operationalState.escalationRisk === 'critical'
                        ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                        : 'bg-orange-50 text-orange-700 border-orange-200'}`}
                  >
                    {operationalSignal.operationalState.escalationRisk === 'critical' ? '⚠ Critical Escalation' : '▲ Elevated Posture'}
                  </motion.span>
                ) : (
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full transition-colors 
                    ${mode === 'simulator' ? 'bg-amber-100/50 text-amber-700 border border-amber-200/60' :
                      mode === 'integration' ? 'bg-blue-100/50 text-blue-700 border border-blue-200/60' : risk.badge}`}>
                    {mode === 'simulator' ? 'Simulation Environment' : mode === 'integration' ? 'Infrastructure Layer' : `${baseData?.risk ?? 'Low'} Risk · ${selectedDayCtx.operationalLabel}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WeatherWidget />

            <div className="w-px h-8 bg-slate-200/60" />

            <div className="flex items-center gap-3 p-1.5 pr-4 vision-glass-light rounded-xl cursor-pointer hover:bg-black/5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
                <User size={15} className="text-white" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-800">Sunny Satwik</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Chief Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Day Selector (Hidden in Simulator and Integration Hub) ── */}
        {mode === 'insights' && (
          <div className="flex items-center gap-2 mb-5 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:block mr-1">Forecast Window</span>
            <div className="flex gap-1.5 p-1.5 vision-glass rounded-2xl">
              {DAYS.map(({ label, dateLabel, isToday, index, dataIndex }) => {
                const dayData = dashboardData[dataIndex];
                const r = riskConfig[dayData?.risk] ?? riskConfig.Low;
                const isActive = selectedDayIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDayIndex(index)}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex flex-col items-center gap-0.5 ${isActive
                      ? 'bg-white text-slate-800 shadow-md shadow-blue-500/10'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-white/50'
                      }`}
                    title={dateLabel}
                  >
                    <span>{isToday ? 'Today' : label}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? r.dot : 'bg-slate-200'}`} />
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-2 vision-glass-light px-4 py-2 rounded-xl">
              <Sparkles size={14} className="text-emerald-500" />
              <span className="text-xs font-semibold text-slate-600 hidden sm:block">
                AI Confidence: <span className="text-emerald-600 font-bold font-mono">{baseData?.confidence ?? 0}%</span>
              </span>
            </div>
          </div>
        )}

        {/* ── Grid Content ── */}
        {mode === 'integration' ? (
          <IntegrationHub operationalState={unifiedBaseData} testMode={testMode} />
        ) : mode === 'simulator' ? (
          <ScenarioSimulator
            baseData={unifiedBaseData}
            allData={dashboardData}
            selectedDayIndex={selectedDayIndex}
            selectedDayCtx={selectedDayCtx}
            operationalSignal={operationalSignal}
          />
        ) : mode === 'readiness' ? (
          <OperationalReadiness
            overrides={overrides}
            onOverridesChange={setOverrides}
            operationalSignal={operationalSignal}
            replay={replay}
          />
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start auto-rows-min min-w-0 pb-20">
            {/* LEFT COLUMN: Forecast */}
            <div className="lg:col-span-8 flex flex-col gap-5 min-w-0 h-fit justify-start">

              {/* Forecast Chart Card */}
              <motion.div
                style={{ x: mousePos.x * 12, y: mousePos.y * 8 }}
                className={`vision-card p-6 glass-reflection min-w-0 h-fit shrink-0 flex flex-col ${risk.glow}`}
              >
                {/* Chart header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Predictive Patient Flow</p>
                    <h2 className="text-2xl font-display font-bold text-slate-800">7-Day Surge Forecast</h2>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${risk.badge}`}>
                      <AlertTriangle size={12} />
                      {unifiedBaseData?.risk ?? 'Low'} Risk
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium">{selectedDayCtx.operationalLabel}</p>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[320px] w-full min-w-0">
                  <ForecastChart
                    data={dashboardData ?? []}
                    selectedIndex={selectedDayIndex}
                  />
                </div>

                {/* Micro analytics strip */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <MicroStat label="Today's Load" value={`${unifiedBaseData?.load ?? 0}%`} up />
                  <MicroStat label="Patients" value={unifiedBaseData?.expectedPatients ?? 0} up />
                  <MicroStat label="Confidence" value={`${unifiedBaseData?.confidence ?? 0}%`} neutral />
                  <MicroStat
                    label="vs Baseline"
                    value={unifiedBaseData?.load != null ? `${unifiedBaseData.load > 65 ? '+' : ''}${(unifiedBaseData.load - 65).toFixed(1)}%` : '—'}
                    up={unifiedBaseData?.load != null && unifiedBaseData.load > 65}
                    neutral={unifiedBaseData?.load == null}
                  />
                </div>
              </motion.div>

            </div>

            {/* RIGHT COLUMN: Predictive Intelligence, Unit Pressure */}
            <div className="lg:col-span-4 flex flex-col gap-5 min-w-0 h-fit justify-start">
              <div className="min-w-0 h-fit shrink-0">
                <Recommendations baseData={unifiedBaseData} />
              </div>
              <div className="min-w-0 h-fit shrink-0">
                <DepartmentSection baseData={unifiedBaseData} />
              </div>
            </div>

          </div>
        )}
      </main>

      {/* ── Floating Status Bar ── */}
      <AnimatePresence>
        {mode !== 'simulator' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
          >
            <motion.div
              animate={operationalSignal?.operationalState?.escalationRisk === 'critical'
                ? { boxShadow: ['0 0 0 0 rgba(239,68,68,0)', '0 0 20px 4px rgba(239,68,68,0.15)', '0 0 0 0 rgba(239,68,68,0)'] }
                : { boxShadow: '0 4px 32px rgba(15,23,42,0.08)' }
              }
              transition={{ duration: 2.5, repeat: Infinity }}
              className="vision-glass px-5 py-3 rounded-2xl flex items-center gap-4 shadow-2xl shadow-slate-900/10"
            >
              {/* Primary: escalation or normal risk */}
              {operationalSignal && operationalSignal.operationalState.escalationRisk !== 'low' ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className={`w-2 h-2 rounded-full ${operationalSignal.operationalState.escalationRisk === 'critical' ? 'bg-red-500' : 'bg-orange-400'
                      }`}
                  />
                  <span className={`text-xs font-black uppercase tracking-widest ${operationalSignal.operationalState.escalationRisk === 'critical' ? 'text-red-700' : 'text-orange-700'
                    }`}>
                    {operationalSignal.operationalState.escalationRisk === 'critical' ? 'Critical Escalation' : 'Elevated Posture'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${risk.dot} animate-pulse`} />
                  <span className="text-xs font-bold text-slate-700">{baseData?.risk ?? 'Low'} Surge · {selectedDayCtx.operationalLabel}</span>
                </div>
              )}
              <div className="w-px h-5 bg-slate-200" />
              <span className="text-xs font-mono font-bold text-emerald-600">{baseData?.confidence ?? 0}% confidence</span>
              {/* Replay indicator */}
              {replay.status === REPLAY_STATUS.PLAYING && (
                <>
                  <div className="w-px h-5 bg-slate-200" />
                  <div className="flex items-center gap-1.5">
                    <Radio size={11} className="text-indigo-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">
                      {replay.scenario?.name ?? 'Replay'} · {replay.currentFrame?.time}
                    </span>
                  </div>
                </>
              )}
              {testMode && (
                <>
                  <div className="w-px h-5 bg-slate-200" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md animate-pulse">
                    ⚙ Test Mode
                  </span>
                </>
              )}
              <div className="w-px h-5 bg-slate-200" />
              <button
                onClick={() => setMode('readiness')}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${operationalSignal?.operationalState?.escalationRisk === 'critical'
                    ? 'text-red-600 hover:text-red-700'
                    : 'text-blue-600 hover:text-blue-700'
                  }`}
              >
                {operationalSignal?.operationalState?.escalationRisk === 'critical' ? 'View Escalation' : 'Run Protocols'} <ArrowUpRight size={12} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Sub-components ── */

const NavItem = ({ icon: Icon, label, seq, active = false, onClick, alert = false }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all group relative text-sm font-semibold
    ${active
      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/60'
      : 'text-slate-400 hover:text-slate-700 hover:bg-white/60'
    }`}>
    {active && <motion.div layoutId="activeNav" className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]" />}
    <Icon size={18} className={active ? 'text-blue-600 ml-2' : 'group-hover:text-slate-700'} />
    <span className="hidden md:block tracking-tight flex-1">{label}</span>
    {seq && <span className="hidden md:block text-[8px] font-black tracking-widest text-slate-300 group-hover:text-slate-400 transition-colors ml-auto">{seq}</span>}
    {alert && !active && (
      <motion.span
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="hidden md:block w-1.5 h-1.5 rounded-full bg-red-500 ml-auto shadow-[0_0_6px_rgba(239,68,68,0.6)]"
      />
    )}
  </button>
);

const MicroStat = ({ label, value, up, neutral }) => (
  <div className="vision-glass-light px-3 py-2.5 rounded-xl flex flex-col gap-0.5 h-full justify-between">
    <span className="label-meta-sm">{label}</span>
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-sm font-mono font-bold text-slate-800">{value}</span>
      {!neutral && (
        <span className={`text-xs font-bold ${up ? 'text-rose-500' : 'text-emerald-500'}`}>
          {up ? '↑' : '↓'}
        </span>
      )}
    </div>
  </div>
);

export default Dashboard;
