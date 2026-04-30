import React from 'react';
import { motion } from 'motion/react';
import { Info } from 'lucide-react';

const SHAPPanel = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Explainer
            <Info size={16} className="text-slate-600 cursor-help" />
          </h3>
          <p className="text-slate-500 text-xs mt-1">Why is {data.day}, {data.date} {data.risk} risk?</p>
        </div>
      </div>

      <div className="space-y-6">
        {data.shap.map((item, index) => (
          <div key={`${data.day}-${index}`} className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold tracking-wider uppercase">
              <span className="text-slate-400">{item.factor}</span>
              <span className={item.type === 'negative' ? 'text-red-400' : 'text-green-400'}>
                {item.type === 'negative' ? '+' : '-'}{item.value}% Impact
              </span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.abs(item.value)}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-full rounded-full ${item.type === 'negative' ? 'bg-gradient-to-r from-red-600 to-pink-500' : 'bg-gradient-to-r from-green-600 to-emerald-400'}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3 text-xs text-slate-500">
        <div className="w-2 h-2 rounded-full bg-pink-500" /> 
        <span>Red increases risk load</span>
        <div className="w-2 h-2 rounded-full bg-emerald-400 ml-2" />
        <span>Green mitigates load</span>
      </div>
    </div>
  );
};

export default SHAPPanel;
