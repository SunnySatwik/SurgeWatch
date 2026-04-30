import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Zap } from 'lucide-react';

const Recommendations = ({ actions }) => {
  return (
    <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="text-cyan-400" size={24} />
        <h3 className="text-xl font-bold tracking-tight text-white">Actionable Steps</h3>
      </div>
      
      <div className="space-y-4 mb-8">
        {actions.map((action, index) => (
          <motion.div 
            key={action}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="mt-1 flex-shrink-0">
              <CheckCircle2 size={18} className="text-cyan-500/50 group-hover:text-cyan-400" />
            </div>
            <span className="text-sm font-medium text-slate-200">{action}</span>
          </motion.div>
        ))}
      </div>

      <button className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] transition-all rounded-2xl text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25">
        Execute All Actions
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default Recommendations;
