import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Gauge, Heart, Users, Bed, Wind,
  FlaskConical, TrendingUp, TrendingDown,
  Minus, Activity, ShieldAlert
} from 'lucide-react';
import { fetchRisk, fetchOperationalMetrics, runRiskAssessment } from '../../utils/operationsService';

const RiskGauge = ({ score, level }) => {
  const colors = {
    LOW: { ring: 'text-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', glow: 'shadow-emerald-200' },
    MODERATE: { ring: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', glow: 'shadow-amber-200' },
    HIGH: { ring: 'text-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', glow: 'shadow-orange-200' },
    CRITICAL: { ring: 'text-red-500', bg: 'bg-red-50', text: 'text-red-700', glow: 'shadow-red-200' },
  };
  const c = colors[level] || colors.LOW;

  // SVG arc for gauge
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * 0.75; // 270-degree arc
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative flex flex-col items-center">
      <svg width="150" height="120" viewBox="0 0 150 130" className="overflow-visible">
        {/* Background arc */}
        <circle
          cx="75" cy="75" r={radius}
          fill="none" stroke="#E5E7EB" strokeWidth="10"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform="rotate(135 75 75)"
        />
        {/* Progress arc */}
        <motion.circle
          cx="75" cy="75" r={radius}
          fill="none" stroke="currentColor" strokeWidth="10"
          className={c.ring}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
          transform="rotate(135 75 75)"
        />
      </svg>
      {/* Center text */}
      <div className="absolute top-[38px] flex flex-col items-center">
        <motion.span
          key={score}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-3xl font-mono font-black ${c.text}`}
        >
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
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <span className="text-[11px] font-mono font-bold text-slate-500 w-14 text-right">
        {occupied}/{total}
      </span>
      <span className={`text-[10px] font-bold w-10 text-right ${pct > 85 ? 'text-red-500' : pct > 70 ? 'text-amber-500' : 'text-emerald-500'}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
};

const OperationalReadiness = () => {
  const [risk, setRisk] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);

  const loadData = async () => {
    try {
      const [riskRes, metricsRes] = await Promise.all([
        fetchRisk(),
        fetchOperationalMetrics()
      ]);
      if (riskRes.success) setRisk(riskRes);
      if (metricsRes.success) setMetrics(metricsRes);
    } catch (err) {
      console.error('Failed to load readiness data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAssess = async () => {
    setAssessing(true);
    try {
      const result = await runRiskAssessment();
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <Activity size={20} className="animate-pulse" />
          <span className="text-sm font-medium">Loading operational state...</span>
        </div>
      </div>
    );
  }

  const latestMetric = metrics?.metrics?.[0];
  const beds = metrics?.beds || risk?.beds || [];
  const staffing = metrics?.staffing || [];

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0 pb-20 font-sans">

      {/* LEFT: Risk & Metrics */}
      <div className="lg:col-span-8 flex flex-col gap-5 min-w-0">

        {/* Risk Gauge + KPIs */}
        <div className="vision-card glass-reflection p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="flex items-center gap-2 mb-5 relative z-10">
            <Gauge size={16} className="text-indigo-500" />
            <h3 className="text-sm font-display font-bold text-slate-800">Operational Risk Assessment</h3>
            <button
              onClick={handleAssess}
              disabled={assessing}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
            >
              <ShieldAlert size={12} />
              {assessing ? 'Assessing...' : 'Run Assessment'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
            {risk && <RiskGauge score={risk.score} level={risk.level} />}

            <div className="flex-1 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Risk Factors</p>
              {(risk?.factors || []).map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${f.impact >= 15 ? 'bg-red-500' : f.impact >= 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-xs text-slate-600 flex-1">{f.factor}</span>
                  <span className="text-xs font-mono font-bold text-slate-500">{f.value}</span>
                  <span className={`text-[10px] font-bold ${f.impact >= 15 ? 'text-red-500' : f.impact >= 10 ? 'text-amber-500' : 'text-slate-400'}`}>
                    +{f.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Metric Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Operational Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard icon={Heart} label="Admissions" value={latestMetric?.total_admissions ?? '—'} trend="up" color="text-rose-500" bgColor="bg-rose-50" />
            <MetricCard icon={TrendingDown} label="Discharges" value={latestMetric?.total_discharges ?? '—'} trend="down" color="text-emerald-500" bgColor="bg-emerald-50" />
            <MetricCard icon={Activity} label="ER Visits" value={latestMetric?.er_visits ?? '—'} trend="up" color="text-blue-500" bgColor="bg-blue-50" />
            <MetricCard icon={Gauge} label="Occupancy" value={`${latestMetric?.occupancy_pct?.toFixed(1) ?? '—'}%`} subtitle="Overall" color="text-indigo-500" bgColor="bg-indigo-50" />
          </div>
        </div>

        {/* Bed Census */}
        <div className="vision-card glass-reflection p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bed size={16} className="text-purple-500" />
            <h3 className="text-sm font-display font-bold text-slate-800">Bed Census</h3>
            <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-Time</span>
          </div>
          <div className="space-y-0.5">
            {beds.map((b, i) => (
              <BedBar key={i} department={b.department} occupied={b.occupied_beds ?? b.occupied} total={b.total_beds ?? b.total} occupancy={b.occupancy_pct ?? b.occupancy} />
            ))}
            {beds.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No bed data available</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Staffing & Weather */}
      <div className="lg:col-span-4 flex flex-col gap-5 min-w-0">

        {/* Staffing Overview */}
        <div className="vision-card glass-reflection p-5 flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-purple-500" />
            <h3 className="text-sm font-display font-bold text-slate-800">Staffing Status</h3>
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
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {s.nurses_on_duty}N · {s.doctors_on_duty}D · {s.on_call_available} on-call
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {s.nurse_patient_ratio?.toFixed(2) ?? '—'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${statusColors[s.coverage_status] || statusColors.adequate}`}>
                      {s.coverage_status}
                    </span>
                  </div>
                </div>
              );
            })}
            {staffing.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No staffing data available</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="vision-card glass-reflection p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wind size={16} className="text-blue-500" />
            <h3 className="text-sm font-display font-bold text-slate-800">Environmental</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={FlaskConical} label="Lab Signals" value={`${risk?.factors?.find(f => f.factor.includes('Lab'))?.value || 'Stable'}`} color="text-rose-500" bgColor="bg-rose-50" />
            <MetricCard icon={Wind} label="Weather" value={`${risk?.factors?.find(f => f.factor.includes('eather'))?.value || 'Clear'}`} color="text-blue-500" bgColor="bg-blue-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalReadiness;
