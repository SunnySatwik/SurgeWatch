import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const loadEntry = payload.find(p => p.dataKey === 'load');
  const baseEntry = payload.find(p => p.dataKey === 'baseline');
  const load = loadEntry?.value ?? 0;
  const base = baseEntry?.value ?? 0;
  return (
    <div className="vision-glass px-5 py-4 rounded-2xl shadow-xl min-w-[140px]">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-mono font-bold text-slate-800 leading-none mb-1">{load}%</p>
      <p className="text-xs text-slate-400 font-medium mb-2">vs. {base}% baseline</p>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-blue-600" />
        <span className="text-xs font-semibold text-blue-600">Neural Projection</span>
      </div>
    </div>
  );
};

const ForecastChart = ({ data = [], selectedIndex = 0 }) => {
  const chartData = (data || []).map((d, i) => ({
    name: d?.day ?? '',
    load: d?.load ?? 0,
    baseline: Math.max(0, (d?.load ?? 0) - 12 - i * 1.5),
  }));

  return (
    <div className="w-full h-full relative min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -20, bottom: 28 }}>
          <defs>
            <linearGradient id="gradLoad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(15,23,42,0.06)" />

          <XAxis
            dataKey="name"
            axisLine={false} tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            axisLine={false} tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
            tickFormatter={v => `${v}%`}
            domain={[0, 100]}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2563eb', strokeWidth: 1.5, strokeDasharray: '4 4' }} />

          {/* Historical ghost */}
          <Area type="monotone" dataKey="baseline"
            stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4"
            fill="url(#gradBaseline)" fillOpacity={1} activeDot={false} />

          {/* Primary forecast */}
          <Area type="monotone" dataKey="load"
            stroke="#2563eb" strokeWidth={3} fill="url(#gradLoad)" fillOpacity={1}
            animationDuration={1800}
            activeDot={{ r: 6, fill: '#fff', stroke: '#2563eb', strokeWidth: 3 }} />

          {/* Critical threshold */}
          <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={1.5}
            label={{ value: '⚠ Critical', position: 'right', fill: '#f43f5e', fontSize: 11, fontWeight: 700 }} />

          {/* Selected day marker */}
          {chartData[selectedIndex] && (
            <ReferenceLine
              x={chartData[selectedIndex].name}
              stroke="#6366f1" strokeWidth={2} strokeDasharray="3 3"
              label={{ value: '▼', position: 'top', fill: '#6366f1', fontSize: 11 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend — properly visible */}
      <div className="absolute bottom-0 left-2 flex items-center gap-5 pointer-events-none pb-1">
        <div className="flex items-center gap-2">
          <svg width="18" height="10" viewBox="0 0 18 10">
            <line x1="0" y1="5" x2="18" y2="5" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-semibold text-slate-600 tracking-wide">Forecast</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="18" height="10" viewBox="0 0 18 10">
            <line x1="0" y1="5" x2="18" y2="5" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-semibold text-slate-500 tracking-wide">Baseline</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="18" height="10" viewBox="0 0 18 10">
            <line x1="0" y1="5" x2="18" y2="5" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-semibold text-rose-500 tracking-wide">Critical</span>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;
