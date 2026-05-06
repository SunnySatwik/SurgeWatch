import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BellRing, ChevronRight, CheckCircle2 } from 'lucide-react';

const Recommendations = ({ actions = [] }) => {
  const actionList = actions || [];

  return (
    <div className="vision-card p-8 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <BellRing size={20} className="text-blue-600" />
        </div>
        <h3 className="text-xl font-display font-bold text-slate-800">Tactical Directives</h3>
      </div>

      <div className="space-y-4 flex-1">
        {actionList.map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="vision-glass-light p-5 rounded-2xl border-white/40 hover:border-blue-500/30 transition-all group cursor-default"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <CheckCircle2 size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 mb-1">Recommendation {i + 1}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{action ?? 'No specific action detail provided.'}</p>
              </div>
            </div>
            
            <button className="mt-4 w-full py-2.5 bg-white border border-slate-100 text-slate-800 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
              Review Action <ArrowRight size={12} />
            </button>
          </motion.div>
        ))}
        {actionList.length === 0 && (
          <div className="p-8 text-center text-slate-400 italic vision-glass-light rounded-2xl">
            No active recommendations for this period.
          </div>
        )}
      </div>

      <button className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
        Execute All Actions
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default Recommendations;
