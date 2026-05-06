import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="vision-glass p-5 rounded-3xl border-white/40 shadow-2xl backdrop-blur-3xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-display font-bold text-slate-800">
          {payload[0]?.value ?? 0}% <span className="text-sm font-medium text-slate-400">Capacity</span>
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-blue-600 uppercase">Neural Projection</span>
        </div>
      </div>
    );
  }
  return null;
};

const ForecastChart = ({ data = [], selectedIndex, onSelect }) => {
  const chartData = (data || []).map((d, index) => ({
    name: d?.day ?? '',
    load: d?.load ?? 0,
    index: index
  }));

  return (
    <div className="w-full h-full relative min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          onMouseMove={(state) => {
            if (state && state.activeTooltipIndex !== undefined) {
              onSelect?.(state.activeTooltipIndex);
            }
          }}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007aff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#007aff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="8 8" 
            vertical={false} 
            stroke="rgba(0, 0, 0, 0.05)" 
          />
          
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
            dy={15}
          />
          
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
            tickFormatter={(v) => `${v}%`}
          />
          
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: '#007aff', strokeWidth: 2, strokeDasharray: '6 6' }}
          />

          <Area
            type="monotone"
            dataKey="load"
            stroke="#007aff"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorLoad)"
            animationDuration={2000}
            activeDot={{ 
              r: 8, 
              fill: '#fff', 
              stroke: '#007aff', 
              strokeWidth: 4,
              className: "shadow-2xl" 
            }}
          />

          <ReferenceLine
            y={80}
            stroke="#f43f5e"
            strokeDasharray="5 5"
            label={{ 
              value: 'CRITICAL', 
              position: 'right', 
              fill: '#f43f5e', 
              fontSize: 10, 
              fontWeight: 800,
              className: "uppercase tracking-widest"
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Floating Insight Overlay */}
      <div className="absolute top-0 right-0 p-4 pointer-events-none">
        <div className="vision-glass-light px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Confidence: 94.8%</span>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;
