import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BellRing, Sparkles, Zap, Clock, Truck, Wind,
  Users, Activity, Globe, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import { deriveDirectives } from '../../utils/directivesEngine';
import { deriveUnitDisposition } from '../../utils/unitDispositionEngine';

const urgencyConfig = {
  Critical: { label: 'Immediate',  textColor: 'text-red-600',    bg: 'bg-red-50 border-red-100',       barColor: 'from-red-400 to-red-600',       icon: Zap },
  High:     { label: 'Urgent',     textColor: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', barColor: 'from-orange-400 to-orange-500',  icon: Zap },
  Moderate: { label: 'Within 4h',  textColor: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100',   barColor: 'from-amber-400 to-amber-500',    icon: Clock },
  Low:      { label: 'Routine',    textColor: 'text-slate-500',  bg: 'bg-slate-50 border-slate-100',   barColor: 'from-slate-300 to-slate-400',    icon: Clock },
};

const domainIconMap = {
  Transport:   Truck,
  Respiratory: Wind,
  Staffing:    Users,
  Throughput:  Activity,
  ICU:         Activity,
  Regional:    Globe,
  Resources:   CheckCircle2,
  Operational: CheckCircle2,
};

const headerUrgency = (directives) => {
  if (directives.some(d => d.urgency === 'Critical')) return urgencyConfig.Critical;
  if (directives.some(d => d.urgency === 'High'))     return urgencyConfig.High;
  if (directives.some(d => d.urgency === 'Moderate')) return urgencyConfig.Moderate;
  return urgencyConfig.Low;
};

const Recommendations = ({ baseData }) => {
  // Derive units first (same memo pattern as DepartmentSection, but computed here to avoid prop-drilling)
  const units = useMemo(() => deriveUnitDisposition(baseData), [
    baseData?.intelligence?.escalation,
    baseData?.intelligence?.conditions?.ambulanceFlow,
    baseData?.intelligence?.conditions?.isolationCapacity,
    baseData?.intelligence?.conditions?.erCongestion,
    baseData?.metrics?.osi,
  ]);

  // Derive directives from intelligence state + unit stress
  const directives = useMemo(() => deriveDirectives(baseData, units), [
    baseData?.intelligence?.escalation,
    baseData?.intelligence?.conditions?.ambulanceFlow,
    baseData?.intelligence?.conditions?.isolationCapacity,
    baseData?.intelligence?.conditions?.erCongestion,
    baseData?.intelligence?.conditions?.respiratoryPressure,
    baseData?.intelligence?.conditions?.staffingStability,
    baseData?.intelligence?.conditions?.traumaVelocity,
    baseData?.metrics?.osi,
    baseData?.metrics?.icuWindow,
    units,
  ]);

  const headerUrg = headerUrgency(directives);
  const HeaderIcon = headerUrg.icon;

  return (
    <div className="vision-card p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <BellRing size={15} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-slate-800">AI Directives</h3>
            <div className="flex items-center gap-1">
              <Sparkles size={9} className="text-emerald-500" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                Intelligence-Derived · {directives.length} Active
              </span>
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest ${headerUrg.bg} ${headerUrg.textColor}`}>
          <HeaderIcon size={10} />
          {headerUrg.label}
        </div>
      </div>

      {/* Directives */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {directives.map((directive, i) => {
            const urg = urgencyConfig[directive.urgency] ?? urgencyConfig.Low;
            const DomainIcon = domainIconMap[directive.domain] ?? Activity;

            return (
              <motion.div
                key={directive.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="group p-4 rounded-2xl bg-white/60 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-default"
              >
                <div className="flex items-start gap-3">
                  {/* Priority number */}
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${urg.bg}`}>
                    <span className={`text-[9px] font-black ${urg.textColor}`}>{i + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <p className="text-xs font-semibold text-slate-800 leading-snug mb-1">{directive.title}</p>

                    {/* Rationale */}
                    <p className="text-[10px] text-slate-500 leading-relaxed mb-2.5">{directive.rationale}</p>

                    {/* Metadata row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Domain tag */}
                      <div className="flex items-center gap-1">
                        <DomainIcon size={9} className="text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{directive.domain}</span>
                      </div>

                      <span className="text-slate-200">·</span>

                      {/* Urgency badge */}
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${urg.textColor}`}>
                        {urg.label}
                      </span>

                      <span className="text-slate-200">·</span>

                      {/* Impact */}
                      <span className="text-[9px] text-slate-400 font-medium">{directive.impact}</span>
                    </div>
                  </div>

                  <ArrowUpRight size={13} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-0.5" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {directives.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-300">
            <BellRing size={24} className="mb-2" />
            <p className="text-xs font-medium">No active directives</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
