import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const loadEntry = payload.find(p => p.dataKey === 'load');
  const load = loadEntry?.value ?? 0;
  return (
    <div className="vision-glass px-4 py-3 rounded-2xl shadow-xl">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-mono font-bold text-slate-800">{load}%</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Neural Projection</span>
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
        <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="gradLoad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#2563eb" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#94a3b8" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(15,23,42,0.05)" />

          <XAxis
            dataKey="name"
            axisLine={false} tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            dy={10}
          />
          <YAxis
            axisLine={false} tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            tickFormatter={v => `${v}%`}
            domain={[0, 100]}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2563eb', strokeWidth: 1.5, strokeDasharray: '4 4' }} />

          {/* Historical ghost */}
          <Area type="monotone" dataKey="baseline"
            stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 4"
            fill="url(#gradBaseline)" fillOpacity={1} activeDot={false} />

          {/* Primary forecast */}
          <Area type="monotone" dataKey="load"
            stroke="#2563eb" strokeWidth={3} fill="url(#gradLoad)" fillOpacity={1}
            animationDuration={1800}
            activeDot={{ r: 6, fill: '#fff', stroke: '#2563eb', strokeWidth: 3 }} />

          {/* Critical threshold */}
          <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={1.5}
            label={{ value: 'Critical', position: 'right', fill: '#f43f5e', fontSize: 9, fontWeight: 800 }} />

          {/* Selected day marker */}
          {chartData[selectedIndex] && (
            <ReferenceLine
              x={chartData[selectedIndex].name}
              stroke="#6366f1" strokeWidth={2} strokeDasharray="3 3"
              label={{ value: '▼', position: 'top', fill: '#6366f1', fontSize: 10 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="absolute bottom-0 left-2 flex items-center gap-4 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-600 rounded" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">Forecast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-slate-300 rounded border-dashed" style={{ borderTop: '1px dashed #cbd5e1', background: 'none' }} />
          <span className="text-[8px] font-bold text-slate-400 uppercase">Baseline</span>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;
