import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, TrendingDown, Minus,
  Eye, Activity, Truck, Wind, Users, Gauge, AlertTriangle
} from 'lucide-react';
import { derivePredictiveInsights } from '../../utils/predictiveInsightsEngine';

const trendConfig = {
  deteriorating: {
    icon: TrendingDown,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    label: 'Deteriorating',
    barColor: 'from-rose-400 to-rose-600',
  },
  watch: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    label: 'Monitor',
    barColor: 'from-amber-300 to-amber-500',
  },
  improving: {
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    label: 'Improving',
    barColor: 'from-emerald-400 to-emerald-600',
  },
  stable: {
    icon: Minus,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-100',
    label: 'Nominal',
    barColor: 'from-slate-300 to-slate-400',
  },
};

const domainIcon = {
  Transport: Truck,
  Respiratory: Wind,
  Staffing: Users,
  Throughput: Activity,
  ICU: Gauge,
  Surge: AlertTriangle,
  Operational: Eye,
};

const Recommendations = ({ baseData }) => {
  const insights = useMemo(() => derivePredictiveInsights(baseData), [
    baseData?.intelligence?.escalation,
    baseData?.intelligence?.conditions?.ambulanceFlow,
    baseData?.intelligence?.conditions?.isolationCapacity,
    baseData?.intelligence?.conditions?.erCongestion,
    baseData?.intelligence?.conditions?.respiratoryPressure,
    baseData?.intelligence?.conditions?.staffingStability,
    baseData?.metrics?.osi,
    baseData?.metrics?.surgeProb,
    baseData?.metrics?.icuWindow,
  ]);

  // Header state: worst trend in list
  const worstTrend = insights.find(i => i.trend === 'deteriorating')?.trend
    ?? insights.find(i => i.trend === 'watch')?.trend
    ?? 'stable';
  const headerCfg = trendConfig[worstTrend];
  const HeaderIcon = headerCfg.icon;

  return (
    <div className="vision-card p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Eye size={15} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-slate-800">Predictive Intelligence</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Forecast signals · {insights.length} active
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest ${headerCfg.bg} ${headerCfg.border} ${headerCfg.color}`}>
          <HeaderIcon size={10} />
          {headerCfg.label}
        </div>
      </div>

      {/* Insight list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {insights.map((insight, i) => {
            const cfg = trendConfig[insight.trend] ?? trendConfig.stable;
            const TrendIcon = cfg.icon;
            const DomainIcon = domainIcon[insight.domain] ?? Eye;

            return (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="p-3.5 rounded-2xl bg-white/60 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all cursor-default"
              >
                <div className="flex items-start gap-3">
                  {/* Trend indicator */}
                  <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${cfg.bg} ${cfg.border} border`}>
                    <TrendIcon size={11} className={cfg.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title + horizon */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{insight.title}</p>
                      <span className="text-[8px] font-mono font-bold text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
                        {insight.horizon}
                      </span>
                    </div>

                    {/* Observation */}
                    <p className="text-[10px] text-slate-500 leading-relaxed mb-2">{insight.observation}</p>

                    {/* Domain + trend row */}
                    <div className="flex items-center gap-2">
                      <DomainIcon size={9} className="text-slate-400" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{insight.domain}</span>
                      <span className="text-slate-200">·</span>
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {insights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-300">
            <Eye size={22} className="mb-2" />
            <p className="text-xs font-medium">No forecast signals active</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
