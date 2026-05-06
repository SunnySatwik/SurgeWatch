import React from 'react';
import { motion } from 'motion/react';
import { BellRing, ChevronRight, Sparkles, Clock, Zap, ArrowUpRight } from 'lucide-react';

const urgencyConfig = {
  Critical: { label: 'Immediate', color: 'text-red-600',    bg: 'bg-red-50 border-red-100', icon: Zap },
  High:     { label: 'Urgent',    color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', icon: Zap },
  Moderate: { label: '4–6 hrs',   color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100',  icon: Clock },
  Medium:   { label: '4–6 hrs',   color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100',  icon: Clock },
  Low:      { label: 'Routine',   color: 'text-slate-500',  bg: 'bg-slate-50 border-slate-100',  icon: Clock },
};

const impactLabels = ['Staffing', 'Capacity', 'Imaging', 'Resources', 'Throughput'];
const impactScores = [85, 72, 60, 90, 68];

const Recommendations = ({ actions = [], riskLevel = 'Low' }) => {
  const actionList = actions || [];
  const urg = urgencyConfig[riskLevel] ?? urgencyConfig.Low;
  const UrgIcon = urg.icon;

  return (
    <div className="vision-card p-5 h-full flex flex-col">
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
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">AI Generated</span>
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest ${urg.bg} ${urg.color}`}>
          <UrgIcon size={10} />
          {urg.label}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5 flex-1">
        {actionList.map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="group p-4 rounded-2xl bg-white/60 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-default"
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-black text-indigo-600">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 leading-relaxed">{action ?? 'No detail provided.'}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{impactLabels[i % impactLabels.length]}</span>
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${impactScores[i % impactScores.length]}%` }}
                      transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">{impactScores[i % impactScores.length]}%</span>
                </div>
              </div>
              <ArrowUpRight size={13} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-0.5" />
            </div>
          </motion.div>
        ))}
        {actionList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-300">
            <BellRing size={24} className="mb-2" />
            <p className="text-xs font-medium">No active directives</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <button className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
        Deploy All Directives
        <ChevronRight size={15} />
      </button>
    </div>
  );
};

export default Recommendations;
