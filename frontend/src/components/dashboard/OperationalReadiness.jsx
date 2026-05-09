import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gauge, Heart, Users, Bed, Wind,
  FlaskConical, TrendingUp, TrendingDown,
  Minus, Activity, ShieldAlert,
  Shield, ShieldCheck, ShieldOff,
  Zap, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, ListChecks
} from 'lucide-react';
import {
  fetchRisk, fetchOperationalMetrics, runRiskAssessment,
  fetchProtocols, activateProtocol, deactivateProtocol, fetchAlerts
} from '../../utils/operationsService';
import { deriveUnitDisposition } from '../../utils/unitDispositionEngine';
import OperationalControlPanel, { DEFAULT_OVERRIDES, overridesToScenario } from './OperationalControlPanel';
import ReplayControls from './ReplayControls';

const RiskGauge = ({ score, level }) => {
  const colors = {
    LOW: { ring: 'text-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', glow: 'shadow-emerald-200' },
    MODERATE: { ring: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', glow: 'shadow-amber-200' },
    HIGH: { ring: 'text-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', glow: 'shadow-orange-200' },
    CRITICAL: { ring: 'text-red-500', bg: 'bg-red-50', text: 'text-red-700', glow: 'shadow-red-200' },
  };
  const c = colors[level] || colors.LOW;

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * 0.75;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative flex flex-col items-center">
      <svg width="150" height="120" viewBox="0 0 150 130" className="overflow-visible">
        <circle cx="75" cy="75" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="10"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeDashoffset={0}
          strokeLinecap="round" transform="rotate(135 75 75)" />
        <motion.circle cx="75" cy="75" r={radius} fill="none" stroke="currentColor" strokeWidth="10"
          className={c.ring} strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }} strokeLinecap="round" transform="rotate(135 75 75)" />
      </svg>
      <div className="absolute top-[38px] flex flex-col items-center">
        <motion.span key={score} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className={`text-3xl font-mono font-black ${c.text}`}>
          {score}
        </motion.span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Risk Score</span>
      </div>
      <div className={`-mt-3 px-4 py-1 rounded-lg ${c.bg} border border-current/10`}>
        <span className={`text-xs font-black uppercase tracking-widest ${c.text}`}>{level}</span>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, subtitle, trend, color = 'text-indigo-500', bgColor = 'bg-indigo-50' }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-rose-500' : trend === 'down' ? 'text-emerald-500' : 'text-slate-400';
  return (
    <div className="vision-card glass-reflection p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-1.5 rounded-lg ${bgColor}`}>
          <Icon size={14} className={color} />
        </div>
        <TrendIcon size={14} className={trendColor} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-lg font-mono font-black text-slate-800 mt-0.5">{value}</span>
      {subtitle && <span className="text-[10px] text-slate-400 mt-0.5">{subtitle}</span>}
    </div>
  );
};

const BedBar = ({ department, occupied, total, occupancy }) => {
  const pct = occupancy || (total > 0 ? (occupied / total) * 100 : 0);
  const barColor = pct > 85 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs font-bold text-slate-600 w-20 truncate">{department}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColor}`} />
      </div>
      <span className="text-[11px] font-mono font-bold text-slate-500 w-14 text-right">{occupied}/{total}</span>
      <span className={`text-[10px] font-bold w-10 text-right ${pct > 85 ? 'text-red-500' : pct > 70 ? 'text-amber-500' : 'text-emerald-500'}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
};

const statusConfig = {
  active: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: ShieldAlert, label: 'ACTIVE', pulse: true },
  cooldown: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Clock, label: 'COOLDOWN', pulse: false },
  standby: { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: ShieldCheck, label: 'STANDBY', pulse: false },
};

const ProtocolCard = ({ protocol, onActivate, onDeactivate, isLoading }) => {
  const config = statusConfig[protocol.status] || statusConfig.standby;
  const StatusIcon = config.icon;
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`vision-card glass-reflection p-4 relative overflow-hidden transition-all duration-500 ${protocol.status === 'active' ? 'ring-1 ring-red-200' : ''}`}
    >
      {protocol.status === 'active' && (
        <motion.div animate={{ opacity: [0.05, 0.15, 0.05] }} transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-red-500/10 pointer-events-none" />
      )}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${config.bg} relative`}>
            <StatusIcon size={16} className={config.color} />
            {config.pulse && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 tracking-tight">{protocol.name}</h4>
            <p className="text-[9px] font-mono text-slate-400 uppercase">{protocol.code}</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${config.bg} ${config.color} ${config.border}`}>
          {config.label}
        </div>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-3 relative z-10">{protocol.description}</p>
      <div className="flex gap-2 relative z-10">
        {protocol.status === 'standby' && (
          <button onClick={() => onActivate(protocol.id)} disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[10px] font-bold transition-all disabled:opacity-50">
            <Zap size={10} /> Activate
          </button>
        )}
        {protocol.status === 'active' && (
          <button onClick={() => onDeactivate(protocol.id)} disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold transition-all disabled:opacity-50">
            <ShieldOff size={10} /> Stand Down
          </button>
        )}
        {protocol.status === 'cooldown' && (
          <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-500 text-[10px] font-medium">
            <Clock size={10} /> Cooling down
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AlertItem = ({ alert }) => {
  const severityColors = { critical: 'bg-red-500', high: 'bg-orange-500', warning: 'bg-amber-500', info: 'bg-blue-500', success: 'bg-emerald-500' };

  const statusLabels = {
    'ACTIVATED': 'bg-red-50 text-red-600 border-red-200',
    'ESCALATED': 'bg-orange-50 text-orange-600 border-orange-200',
    'STABILIZED': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'RECOVERED': 'bg-blue-50 text-blue-600 border-blue-200',
    'REPLAY EVENT': 'bg-purple-50 text-purple-600 border-purple-200',
    'STOOD DOWN': 'bg-slate-50 text-slate-500 border-slate-200',
    'WARNING': 'bg-amber-50 text-amber-600 border-amber-200',
    'active': 'bg-red-50 text-red-600 border-red-200',
    'acknowledged': 'bg-slate-50 text-slate-500 border-slate-200'
  };

  const statusStyle = statusLabels[alert.status] || statusLabels['active'];

  return (
    <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 py-2">
      <div className="mt-1.5 relative shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${severityColors[alert.severity] || 'bg-slate-400'}`} />
        {['ACTIVATED', 'ESCALATED', 'active'].includes(alert.status) && alert.severity === 'critical' && (
          <span className="absolute -top-0.5 -left-0.5 flex h-3.5 w-3.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${severityColors[alert.severity]} opacity-40`} />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 truncate">{alert.title}</span>
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shrink-0 ${statusStyle}`}>
            {alert.status}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-1">{alert.message}</p>
        <p className="text-[9px] text-slate-400 font-mono mt-1">{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
      </div>
    </motion.div>
  );
};

const OperationalReadiness = ({ baseData, overrides = DEFAULT_OVERRIDES, onOverridesChange, operationalSignal = null, replay = null }) => {
  const [risk, setRisk] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [eventTimeline, setEventTimeline] = useState([]);
  const lastSignalRef = React.useRef(null);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const derivedUnits = React.useMemo(() => deriveUnitDisposition(baseData), [baseData]);

  // Wire _jumpTo so ReplayControls can jump to arbitrary frames
  if (replay) {
    replay._jumpTo = (idx) => {
      const sc = replay.scenario;
      if (!sc?.frames?.[idx]) return;
      replay.controls.pause?.();
      onOverridesChange?.(sc.frames[idx].overrides);
      // Sync frameIndex via reset + re-apply — we drive via setOverrides directly
    };
  }

  const loadData = async () => {
    try {
      const [riskRes, metricsRes, protocolRes, alertRes] = await Promise.all([
        fetchRisk(),
        fetchOperationalMetrics(),
        fetchProtocols(),
        fetchAlerts(1, null, 10)
      ]);
      if (riskRes.success) setRisk(riskRes);
      if (metricsRes.success) setMetrics(metricsRes);
      if (protocolRes.success) setProtocols(protocolRes.protocols);
      if (alertRes.success) setAlerts(alertRes.alerts);
    } catch (err) {
      console.error('Failed to load readiness data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAssess = async () => {
    setAssessing(true);
    try {
      // Show assessing visual feedback
      const scenarioModifiers = overridesToScenario(overrides);
      const result = await runRiskAssessment(scenarioModifiers);
      if (result.success) {
        setRisk(result.risk);
        await loadData();
      }
    } catch (err) {
      console.error('Assessment failed:', err);
    } finally {
      setAssessing(false);
    }
  };

  const handleActivate = async (protocolId) => {
    setActionLoading(true);
    try {
      const result = await activateProtocol(protocolId);
      if (result.success) {
        setToast({ type: 'warning', message: `Protocol activated: ${result.protocol.name}` });
        await loadData();
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Activation failed' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDeactivate = async (protocolId) => {
    setActionLoading(true);
    try {
      const result = await deactivateProtocol(protocolId);
      if (result.success) {
        setToast({ type: 'success', message: `Protocol stood down: ${result.protocol.name}` });
        await loadData();
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Deactivation failed' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };
  // Audit Stream Accumulator logic
  useEffect(() => {
    if (!operationalSignal) return;

    // Detect transitions by comparing with last signal
    const prev = lastSignalRef.current;
    lastSignalRef.current = operationalSignal;

    if (!prev) return; // Skip initial load as telemetry events are usually default success

    // We only want to inject events if the underlying states changed
    const states = operationalSignal.operationalState;
    const prevStates = prev.operationalState;

    const changed = 
      states.ambulanceFlow !== prevStates.ambulanceFlow ||
      states.icuPressure !== prevStates.icuPressure ||
      states.staffingStability !== prevStates.staffingStability ||
      states.respiratoryPressure !== prevStates.respiratoryPressure ||
      states.erCongestion !== prevStates.erCongestion ||
      states.escalationRisk !== prevStates.escalationRisk;

    if (!changed) return;

    // Convert new signal events to timeline format
    // Use a stable hash-like ID based on title + type + approximate time window (to allow repeat events later)
    const newEvents = (operationalSignal.telemetryEvents || []).map(e => ({
      id: `${e.title}-${e.type}-${Math.floor(Date.now() / 5000)}`, // Stable ID within 5s window
      title: e.title,
      message: e.message,
      severity: e.severity,
      status: e.type || 'active',
      created_at: new Date().toISOString(),
    }));

    // Deduplicate against the entire current timeline to prevent re-insertion of same state
    setEventTimeline(prevTimeline => {
      const filteredNew = newEvents.filter(ne => {
        // Don't add if this exact title and status already exists in the recent history (last 10)
        return !prevTimeline.slice(0, 10).some(pe => pe.title === ne.title && pe.status === ne.status);
      });
      
      if (filteredNew.length === 0) return prevTimeline;
      
      // Bounded history: keep last 12 events
      return [...filteredNew, ...prevTimeline].slice(0, 12);
    });

  }, [operationalSignal]);

  // Inject explicit REPLAY EVENT markers when replay boundaries trigger
  useEffect(() => {
    if (replay?.status === 'playing' && replay?.frameIndex === 0) {
      setEventTimeline(prev => {
        const marker = {
          id: `replay-start-${Date.now()}`,
          title: `Scenario Replay: ${replay.scenario?.name || 'Simulation'}`,
          message: 'Initiating operational stress replay sequence.',
          severity: 'info',
          status: 'REPLAY EVENT',
          created_at: new Date().toISOString()
        };
        // Avoid duplicate markers
        if (prev[0]?.title === marker.title && prev[0]?.status === 'REPLAY EVENT') return prev;
        return [marker, ...prev].slice(0, 12);
      });
    }
  }, [replay?.status, replay?.frameIndex, replay?.scenario]);
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <Activity size={20} className="animate-pulse" />
          <span className="text-sm font-medium">Loading operational command layer...</span>
        </div>
      </div>
    );
  }

  const latestMetric = metrics?.metrics?.[0];
  const beds = metrics?.beds || risk?.beds || [];
  const staffing = metrics?.staffing || [];

  const activeProtocols = protocols.filter(p => p.status === 'active');
  const standbyProtocols = protocols.filter(p => p.status !== 'active');

  // Extract directives from active protocols + live signal-driven directives
  const allDirectives = activeProtocols.flatMap(p => {
    const actions = typeof p.actions === 'string' ? JSON.parse(p.actions) : (p.actions || []);
    return actions.map(action => ({ protocol: p.name, action }));
  });



  const mergedAlerts = [...eventTimeline];

  // Apply live readiness delta to the displayed score
  const liveRiskScore = risk
    ? Math.max(0, Math.min(100, risk.score + (operationalSignal?.readinessDelta || 0)))
    : null;
  const liveRisk = risk
    ? {
      ...risk,
      score: liveRiskScore,
      level: liveRiskScore >= 81 ? 'CRITICAL' : liveRiskScore >= 61 ? 'HIGH' : liveRiskScore >= 36 ? 'MODERATE' : 'LOW'
    }
    : null;

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0 pb-20 font-sans">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[200]">
            <div className={`px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold border ${toast.type === 'warning' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
              {toast.type === 'warning' ? <AlertTriangle size={16} /> :
                toast.type === 'error' ? <ShieldOff size={16} /> : <CheckCircle2 size={16} />}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: Replay + Controls + State + Protocols */}
      <div className="lg:col-span-8 flex flex-col gap-5 min-w-0">

        {/* Operational Replay Engine */}
        {replay && (
          <ReplayControls replay={replay} overrides={overrides} />
        )}

        {/* ══ Escalation Posture Banner — primary presentation signal ══ */}
        <AnimatePresence mode="wait">
          {operationalSignal && operationalSignal.operationalState.escalationRisk !== 'low' && (
            <motion.div
              key={operationalSignal.operationalState.escalationRisk}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl border p-4 flex items-center gap-4 relative overflow-hidden
                ${operationalSignal.operationalState.escalationRisk === 'critical'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-orange-50 border-orange-200'}`}
            >
              {/* Ambient pulse on critical */}
              {operationalSignal.operationalState.escalationRisk === 'critical' && (
                <motion.div
                  animate={{ opacity: [0.08, 0.18, 0.08] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-red-400/10 pointer-events-none rounded-2xl"
                />
              )}
              <div className={`p-2.5 rounded-xl relative z-10
                ${operationalSignal.operationalState.escalationRisk === 'critical' ? 'bg-red-100' : 'bg-orange-100'}`}>
                <ShieldAlert size={18} className={operationalSignal.operationalState.escalationRisk === 'critical' ? 'text-red-600' : 'text-orange-600'} />
                {operationalSignal.operationalState.escalationRisk === 'critical' && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-xs font-black uppercase tracking-widest
                    ${operationalSignal.operationalState.escalationRisk === 'critical' ? 'text-red-700' : 'text-orange-700'}`}>
                    {operationalSignal.operationalState.escalationRisk === 'critical' ? 'Critical Escalation Posture' : 'Elevated Escalation Posture'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    operationalSignal.operationalState.icuPressure !== 'stable' && `ICU ${operationalSignal.operationalState.icuPressure}`,
                    operationalSignal.operationalState.erCongestion !== 'stable' && `ER ${operationalSignal.operationalState.erCongestion}`,
                    operationalSignal.operationalState.ambulanceFlow !== 'normal' && `Transport ${operationalSignal.operationalState.ambulanceFlow}`,
                    operationalSignal.operationalState.staffingStability !== 'stable' && `Staffing ${operationalSignal.operationalState.staffingStability}`,
                    operationalSignal.operationalState.respiratoryPressure !== 'normal' && `Respiratory ${operationalSignal.operationalState.respiratoryPressure}`,
                  ].filter(Boolean).map((factor, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border
                      ${operationalSignal.operationalState.escalationRisk === 'critical'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAssess}
                disabled={assessing}
                className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all shrink-0 relative z-10
                  ${operationalSignal.operationalState.escalationRisk === 'critical'
                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                    : 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700'}`}
              >
                {assessing ? 'Assessing...' : 'Assess Now'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Operational Control Console */}
        <OperationalControlPanel 
          overrides={overrides} 
          onChange={(newOverrides) => {
            if (replay?.status === 'playing') {
              replay.controls.pause();
            }
            if (onOverridesChange) onOverridesChange(newOverrides);
          }} 
          replayStatus={replay?.status} 
        />

        {/* A. Operational State */}
        <div className="vision-card glass-reflection p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex items-center gap-2 mb-5 relative z-10">
            <Gauge size={16} className="text-indigo-500" />
            <h3 className="text-sm font-display font-bold text-slate-800">Operational State</h3>
            <button onClick={handleAssess} disabled={assessing}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50">
              <ShieldAlert size={12} />
              {assessing ? 'Assessing...' : 'Run Assessment'}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 relative z-10 items-center md:items-stretch">
            <AnimatePresence mode="wait">
              {liveRisk && (
                <motion.div
                  key={liveRisk.level}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex-shrink-0 flex items-center justify-center"
                >
                  <RiskGauge score={liveRisk.score} level={liveRisk.level} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 w-full">
              <MetricCard icon={Heart} label="Admissions" value={latestMetric?.total_admissions ?? '—'} trend="up" color="text-rose-500" bgColor="bg-rose-50" />
              <MetricCard icon={TrendingDown} label="Discharges" value={latestMetric?.total_discharges ?? '—'} trend="down" color="text-emerald-500" bgColor="bg-emerald-50" />
              <MetricCard icon={Activity} label="ER Visits" value={latestMetric?.er_visits ?? '—'} trend="up" color="text-blue-500" bgColor="bg-blue-50" />
              <MetricCard icon={Users} label="Occupancy" value={`${latestMetric?.occupancy_pct?.toFixed(1) ?? '—'}%`} subtitle="Overall" color="text-indigo-500" bgColor="bg-indigo-50" />
            </div>
          </div>
        </div>

        {/* B. Active Operational Protocols */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Shield size={14} /> Active Operational Protocols
          </h3>
          {activeProtocols.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeProtocols.map(p => (
                <ProtocolCard key={p.id} protocol={p} onActivate={handleActivate} onDeactivate={handleDeactivate} isLoading={actionLoading} />
              ))}
            </div>
          ) : (
            <div className="vision-card glass-reflection p-6 flex flex-col items-center justify-center text-center gap-2">
              <ShieldCheck size={24} className="text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">No Active Protocols</p>
              <p className="text-xs text-slate-400">Operational posture is stable. All surge protocols are in standby.</p>
            </div>
          )}
        </div>

        {/* C. Directives (Mitigation Actions) */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ListChecks size={14} /> Operational Directives
          </h3>
          <div className="vision-card glass-reflection p-5">
            {allDirectives.length > 0 ? (
              <div className="space-y-3">
                {allDirectives.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <ChevronRight size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{d.protocol}</p>
                      <p className="text-sm font-medium text-slate-700">{d.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No active directives. Awaiting protocol activation.</p>
            )}
          </div>
        </div>

        {/* Available Protocols (Standby) */}
        {standbyProtocols.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShieldCheck size={14} /> Standby Protocols
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {standbyProtocols.map(p => (
                <div key={p.id} className="vision-card glass-reflection p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{p.name}</p>
                      <p className="text-[9px] font-mono text-slate-400">{p.code}</p>
                    </div>
                    <button
                      onClick={() => handleActivate(p.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 transition-all disabled:opacity-50"
                    >
                      Activate
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Audit Stream, Beds, Staffing */}
      <div className="lg:col-span-4 flex flex-col gap-5 min-w-0">

        {/* D. Operational Audit Stream */}
        <div className="vision-card glass-reflection p-5 flex flex-col max-h-[300px]">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-display font-bold text-slate-800">Operational Audit</h3>
            {eventTimeline.length > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200">
                Live Timeline
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-1 divide-y divide-slate-100">
            <AnimatePresence>
              {mergedAlerts.map(alert => <AlertItem key={alert.id} alert={alert} />)}
            </AnimatePresence>
            {mergedAlerts.length === 0 && <div className="text-center py-4 text-xs text-slate-400">No recent events</div>}
          </div>
        </div>

        {/* ICU/Bed Pressure */}
        <div className="vision-card glass-reflection p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bed size={16} className="text-purple-500" />
            <h3 className="text-sm font-display font-bold text-slate-800">Unit Pressure</h3>
          </div>
          <div className="space-y-0.5">
            {derivedUnits.map((u, i) => {
              const rawBed = beds.find(b => b.department === u.name);
              const total = rawBed?.total_beds ?? rawBed?.total ?? 100;
              const occupied = Math.round((u.load / 100) * total);
              return (
                <BedBar key={i} department={u.name} occupied={occupied} total={total} occupancy={u.load} />
              );
            })}
            {derivedUnits.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No unit pressure data</p>}
          </div>
        </div>

        {/* Staffing Stability */}
        <div className="vision-card glass-reflection p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-blue-500" />
            <h3 className="text-sm font-display font-bold text-slate-800">Staffing Stability</h3>
          </div>
          <div className="space-y-3">
            {staffing.map((s, i) => {
              const statusColors = {
                adequate: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                strained: 'bg-amber-50 text-amber-600 border-amber-100',
                critical: 'bg-red-50 text-red-600 border-red-100',
              };
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{s.department}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.nurses_on_duty}N · {s.doctors_on_duty}D · {s.on_call_available} on-call</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600">{s.nurse_patient_ratio?.toFixed(2) ?? '—'}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${statusColors[s.coverage_status] || statusColors.adequate}`}>{s.coverage_status}</span>
                  </div>
                </div>
              );
            })}
            {staffing.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No staffing data</p>}
          </div>
        </div>


      </div>
    </div>
  );
};

export default OperationalReadiness;
