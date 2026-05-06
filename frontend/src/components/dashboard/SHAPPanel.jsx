import React from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Info, Cpu, Sparkles } from 'lucide-react';

const SHAPPanel = ({ data }) => {
  const shapData = data?.shap ?? [];
  const maxVal = Math.max(...shapData.map(d => Math.abs(d?.value ?? 0)), 1);

  return (
    <div className="vision-card p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <BrainCircuit size={15} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-slate-800">Neural Attribution</h3>
            <div className="flex items-center gap-1">
              <Sparkles size={9} className="text-indigo-400" />
              <span className="label-meta-sm text-indigo-500">SHAP Explainability</span>
            </div>
          </div>
        </div>
        <button title="What is SHAP?" className="text-slate-300 hover:text-slate-500 transition-colors">
          <Info size={14} />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-1.5 rounded-full bg-rose-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Surge Driver</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mitigating</span>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3 flex-1">
        {shapData.map((item, i) => {
          const isNeg = item?.type === 'negative';
          const width = (Math.abs(item?.value ?? 0) / maxVal) * 100;
          return (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-slate-700 truncate max-w-[60%]">
                  {item?.factor ?? 'Unknown'}
                </span>
                <span className={`text-xs font-mono font-bold ${isNeg ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isNeg ? '+' : '-'}{Math.abs(item?.value ?? 0)}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.9, delay: i * 0.08, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    isNeg
                      ? 'bg-gradient-to-r from-rose-300 to-rose-500'
                      : 'bg-gradient-to-r from-emerald-300 to-emerald-500'
                  }`}
                />
              </div>
            </div>
          );
        })}
        {shapData.length === 0 && (
          <p className="text-xs text-slate-400 italic py-4 text-center">No attribution data available.</p>
        )}
      </div>

      {/* Footer insight */}
      <div className="mt-4 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100/60 flex items-start gap-2.5">
        <Cpu size={13} className="text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {shapData[0]?.factor
            ? `"${shapData[0].factor}" is the primary surge driver for ${data?.day ?? 'this day'}.`
            : 'SHAP engine identifies primary external drivers for capacity surge.'}
        </p>
      </div>
    </div>
  );
};

export default SHAPPanel;
