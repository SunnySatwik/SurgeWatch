import React from 'react';
import { motion } from 'motion/react';
import { Info, BrainCircuit, Cpu } from 'lucide-react';

const SHAPPanel = ({ data }) => {
  const shapData = data?.shap ?? [];

  return (
    <div className="vision-card p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <BrainCircuit size={20} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-display font-bold text-slate-800">Neural Attribution</h3>
        </div>
        <Info size={18} className="text-slate-400 cursor-help hover:text-slate-600" />
      </div>

      <div className="space-y-6 flex-1">
        {shapData.map((item, i) => (
          <div key={i} className="group cursor-default">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item?.factor ?? 'Unknown'}</span>
              <span className={`text-[10px] font-black ${item?.type === 'negative' ? 'text-rose-600' : 'text-blue-600'}`}>
                {item?.type === 'negative' ? '+' : '-'}{item?.value ?? 0}% Impact
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.abs(item?.value ?? 0)}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className={`h-full rounded-full ${item?.type === 'negative' ? 'bg-gradient-to-r from-rose-400 to-rose-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
              />
            </div>
          </div>
        ))}
        {shapData.length === 0 && (
          <p className="text-sm text-slate-400 italic">No attribution data available.</p>
        )}
      </div>

      <div className="mt-8 p-4 vision-glass-light rounded-2xl flex items-center gap-4">
        <div className="flex-shrink-0">
          <Cpu className="text-blue-600 w-5 h-5" />
        </div>
        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
          SHAP-based attribution engine identifies primary external drivers for this surge.
        </p>
      </div>
    </div>
  );
};

export default SHAPPanel;
