import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud, CloudRain, CloudSnow, Sun, CloudLightning, Wind,
  Droplets, Eye, Thermometer, MapPin, RefreshCw, X,
  TrendingUp, AlertTriangle, Activity, ChevronRight, Search, Map
} from 'lucide-react';

/* ─── Weather code → condition mapping (WMO codes) ──────────────── */
const WMO_MAP = {
  0: { label: 'Clear Sky', icon: Sun, gradient: 'from-amber-50 to-orange-50', textColor: 'text-amber-600' },
  1: { label: 'Mainly Clear', icon: Sun, gradient: 'from-amber-50 to-yellow-50', textColor: 'text-amber-500' },
  2: { label: 'Partly Cloudy', icon: Cloud, gradient: 'from-slate-50 to-blue-50', textColor: 'text-blue-500' },
  3: { label: 'Overcast', icon: Cloud, gradient: 'from-slate-100 to-slate-200', textColor: 'text-slate-500' },
  45: { label: 'Foggy', icon: Cloud, gradient: 'from-slate-100 to-zinc-50', textColor: 'text-slate-400' },
  48: { label: 'Icy Fog', icon: CloudSnow, gradient: 'from-blue-50 to-slate-100', textColor: 'text-blue-400' },
  51: { label: 'Light Drizzle', icon: CloudRain, gradient: 'from-blue-50 to-indigo-50', textColor: 'text-blue-500' },
  53: { label: 'Moderate Drizzle', icon: CloudRain, gradient: 'from-blue-100 to-indigo-100', textColor: 'text-blue-600' },
  55: { label: 'Heavy Drizzle', icon: CloudRain, gradient: 'from-indigo-100 to-blue-200', textColor: 'text-indigo-600' },
  61: { label: 'Light Rain', icon: CloudRain, gradient: 'from-blue-100 to-indigo-50', textColor: 'text-blue-600' },
  63: { label: 'Moderate Rain', icon: CloudRain, gradient: 'from-indigo-100 to-blue-100', textColor: 'text-indigo-600' },
  65: { label: 'Heavy Rain', icon: CloudRain, gradient: 'from-indigo-200 to-blue-200', textColor: 'text-indigo-700' },
  71: { label: 'Light Snow', icon: CloudSnow, gradient: 'from-sky-50 to-blue-50', textColor: 'text-sky-500' },
  80: { label: 'Rain Showers', icon: CloudRain, gradient: 'from-blue-100 to-violet-100', textColor: 'text-blue-600' },
  95: { label: 'Thunderstorm', icon: CloudLightning, gradient: 'from-violet-100 to-indigo-200', textColor: 'text-violet-700' },
};

const getCondition = (code) => WMO_MAP[code] ?? WMO_MAP[2];

const getSurgeImpact = (weather) => {
  const temp = weather.current.temperature_2m;
  const humidity = weather.current.relative_humidity_2m;
  const precipProb = weather.current.precipitation_probability;
  const code = weather.current.weather_code;

  if (precipProb > 60 || code === 63 || code === 65 || code === 80 || code === 95) {
    return { level: 'critical', label: 'Severe weather event. Mobilize trauma and ER capacities.', title: 'Critical Operations Alert', color: 'text-rose-600', glow: 'shadow-[inset_4px_0_0_0_#e11d48]', bg: 'bg-rose-50/80 border-rose-200', dot: 'bg-rose-500', surge: '+15–25%' };
  }
  if (humidity > 75 && (code === 51 || code === 53 || code === 55 || code === 45 || code === 48)) {
    return { level: 'high', label: 'High correlation with respiratory admissions and slower ambulance turnaround.', title: 'High Surge Probability', color: 'text-orange-600', glow: 'shadow-[inset_4px_0_0_0_#f97316]', bg: 'bg-orange-50/80 border-orange-200', dot: 'bg-orange-500', surge: '+8–15%' };
  }
  if (temp > 35 || temp < 15 || precipProb > 30) {
    return { level: 'moderate', label: 'Mild correlation with incoming ER visits and minor resource strain.', title: 'Elevated Operational Monitor', color: 'text-amber-600', glow: 'shadow-[inset_4px_0_0_0_#f59e0b]', bg: 'bg-amber-50/80 border-amber-200', dot: 'bg-amber-500', surge: '+3–8%' };
  }
  return { level: 'low', label: 'Stable conditions. No weather-driven surges expected.', title: 'Nominal Operational Impact', color: 'text-emerald-600', glow: 'shadow-[inset_4px_0_0_0_#10b981]', bg: 'bg-emerald-50/80 border-emerald-200', dot: 'bg-emerald-500', surge: '+0–2%' };
};

const generateInsights = (weather, city) => {
  const temp = weather.current.temperature_2m;
  const humidity = weather.current.relative_humidity_2m;
  const wind = weather.current.wind_speed_10m;
  const precipProb = weather.current.precipitation_probability;
  const code = weather.current.weather_code;

  const isBlr = city?.toLowerCase().includes('bengaluru') || city?.toLowerCase().includes('bangalore');

  const insights = [];

  if (humidity > 75 && (code === 51 || code === 53 || code === 55 || code === 45 || code === 48)) {
    insights.push(`High humidity and drizzle: Respiratory OP visits may rise. COPD/asthma admissions likely to increase. ${isBlr ? 'Slower ambulance mobility risk across major city corridors.' : 'Slower ambulance mobility risk.'}`);
  }

  if (precipProb > 50 || code === 61 || code === 63 || code === 65 || code === 80 || code === 95) {
    insights.push(`Heavy precipitation probability: Increased ER trauma likelihood. ${isBlr ? 'High risk of waterlogging on ORR delaying staff commutes and increasing road accident probability.' : 'Delayed commute times for staff and increased road accident probability.'}`);
  }

  if (temp > 34) {
    insights.push(`Temperature spike (${Math.round(temp)}°C): Elevated dehydration risk and heat stress. Emphasize elderly patient monitoring protocols in triage.`);
  } else if (temp < 18) {
    insights.push(`Cooler temperatures (${Math.round(temp)}°C): Potential increase in viral respiratory transmission and cardiovascular stress cases.`);
  }

  if (insights.length === 0 && temp >= 20 && temp <= 32 && humidity < 70 && precipProb < 20) {
    insights.push("Weather stable and dry: Reduced volatility. Lower respiratory uncertainty, leading to a stable operational outlook.");
  }

  if (wind > 25 && insights.length < 3) {
    insights.push("Elevated wind speeds: Potential increase in airborne allergens. Monitor for mild spikes in allergic rhinitis or asthma cases.");
  }

  if (insights.length === 0) {
    insights.push("Conditions nominal: Operating within standard parameters. No major weather-driven anomalies projected for the next 12 hours.");
  }

  return insights.slice(0, 3);
};

/* ─── Location & Storage Helpers ─────────────────────────────────── */

const STORAGE_KEY = 'surgewatch_weather_loc';

const DEFAULT_LOC = {
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'IN',
  lat: 12.9716,
  lon: 77.5946
};

const getSavedLocation = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Could not parse saved location');
  }
  return null;
};

const saveLocation = (loc) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch (e) {
    console.error('Could not save location');
  }
};

const fetchLocation = async () => {
  const saved = getSavedLocation();
  if (saved) return saved;

  return DEFAULT_LOC;
};

/* ─── Backend API Helpers ───────────────────────────────────────── */

const geocode = async (city) => {
  const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(city)}`);

  if (!res.ok) {
    throw new Error('City search failed');
  }

  const payload = await res.json();

  if (!payload.success || !payload.data) {
    throw new Error('City not found');
  }

  return payload.data;
};

const reverseGeocode = async (lat, lon) => {
  const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);

  if (!res.ok) {
    throw new Error('Reverse geocode failed');
  }

  const payload = await res.json();

  if (!payload.success || !payload.data) {
    throw new Error('Could not resolve location');
  }

  return payload.data;
};

const fetchWeather = async (lat, lon) => {
  const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);

  if (!res.ok) {
    throw new Error('Weather fetch failed');
  }

  const payload = await res.json();

  if (!payload.success || !payload.data) {
    throw new Error('Invalid weather response');
  }

  return payload.data;
};

const fetchCurrentBrowserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const location = await reverseGeocode(lat, lon);

          resolve({
            ...location,
            lat,
            lon
          });
        } catch (err) {
          reject(err);
        }
      },
      (err) => reject(err),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
};

/* ─── Compact header chip (always visible) ───────────────────────── */
const WeatherChip = ({ weather, location, loading, errorState, onClick }) => {
  if (loading && !weather) {
    return (
      <button onClick={onClick} className="hidden lg:flex items-center gap-2.5 px-4 py-2 vision-glass-light rounded-xl cursor-pointer hover:bg-white/60 transition-all">
        <div className="w-4 h-4 rounded-full bg-slate-200 animate-pulse" />
        <div>
          <div className="w-20 h-3 bg-slate-200 rounded animate-pulse mb-1" />
          <div className="w-14 h-2 bg-slate-100 rounded animate-pulse" />
        </div>
      </button>
    );
  }
  if (!weather) return null;

  const cond = getCondition(weather.current.weather_code);
  const impact = getSurgeImpact(weather);
  const Icon = cond.icon;
  const temp = Math.round(weather.current.temperature_2m);

  return (
    <button
      onClick={onClick}
      className={`hidden lg:flex items-center gap-2.5 px-4 py-2 vision-glass-light rounded-xl cursor-pointer hover:bg-white/80 transition-all group border shadow-sm ${errorState ? 'border-amber-200/50 bg-amber-50/30' : 'border-white/60'}`}
      title="Open Weather Intelligence"
    >
      <Icon size={16} className={errorState ? 'text-amber-500' : cond.textColor} />
      <div className="text-left">
        <p className="text-xs font-bold text-slate-700 leading-none mb-0.5">
          {cond.label} · {temp}°C
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${errorState ? 'bg-amber-400' : impact.dot} ${loading ? 'animate-pulse' : ''}`} />
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
            {location?.city}{location?.country ? `, ${location.country}` : ''}
            {errorState && ' (Offline)'}
          </p>
        </div>
      </div>
      {loading ? (
        <RefreshCw size={12} className="text-slate-400 animate-spin ml-2" />
      ) : (
        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors ml-2" />
      )}
    </button>
  );
};

/* ─── Premium Hourly bar chart ───────────────────────────────────── */
const HourlyBars = ({ hourly, field, isPrecip, unit }) => {
  if (!hourly) return null;
  const now = new Date().getHours();
  const hours = hourly.time.slice(now, now + 8).map((t, i) => ({
    hour: new Date(t).getHours(),
    value: hourly[field]?.[now + i] ?? 0,
  }));
  const peak = Math.max(...hours.map(h => h.value), isPrecip ? 100 : 10);

  const points = hours.map((h, i) => {
    const x = (i * 12.5) + 6.25;
    const y = 90 - ((h.value / peak) * 80);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative h-28 pt-4 pb-2 flex items-end w-full">
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPrecip ? "#818cf8" : "#60a5fa"} stopOpacity="0.25" />
            <stop offset="100%" stopColor={isPrecip ? "#818cf8" : "#60a5fa"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.polyline
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          points={points}
          fill="none"
          stroke={isPrecip ? "#6366f1" : "#3b82f6"}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <motion.polygon
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          points={`${points} 100,100 0,100`}
          fill={`url(#grad-${field})`}
        />
      </svg>
      {hours.map((h, i) => {
        const heightPx = (h.value / peak) * 64;
        return (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1 z-10 relative group">
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`text-[10px] font-mono font-bold ${isPrecip ? 'text-indigo-600' : 'text-blue-600'} opacity-80 group-hover:opacity-100 transition-opacity`}
            >
              {Math.round(h.value)}{unit}
            </motion.span>
            <div className="w-full flex justify-center items-end" style={{ height: '64px' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPx}px` }}
                transition={{ delay: i * 0.05, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                className={`w-full max-w-[20px] rounded-t-md ${isPrecip ? 'bg-gradient-to-t from-indigo-200/40 to-indigo-400/60 border-indigo-300/50' : 'bg-gradient-to-t from-blue-200/40 to-blue-400/60 border-blue-300/50'} backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] border-t border-l border-r glass-reflection group-hover:brightness-110 transition-all`}
                style={{ minHeight: '4px' }}
              />
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {h.hour === 0 ? '12A' : h.hour < 12 ? `${h.hour}A` : h.hour === 12 ? '12P' : `${h.hour - 12}P`}
            </span>
          </div>
        )
      })}
    </div>
  );
};

/* ─── Full expanded panel ────────────────────────────────────────── */
const WeatherPanel = ({ weather, location, onClose, onCitySearch, onAutoLocate, searching }) => {
  const [cityInput, setCityInput] = useState('');
  const [searchErr, setSearchErr] = useState('');

  // Escape key + scroll lock
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!weather) return null;

  const cond = getCondition(weather.current.weather_code);
  const Icon = cond.icon;
  const impact = getSurgeImpact(weather);
  const temp = Math.round(weather.current.temperature_2m);
  const feelsLike = Math.round(weather.current.apparent_temperature);
  const humidity = weather.current.relative_humidity_2m;
  const windSpeed = Math.round(weather.current.wind_speed_10m);
  const precipProb = weather.current.precipitation_probability;

  const insights = generateInsights(weather, location?.city);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setSearchErr('');
    try {
      await onCitySearch(cityInput.trim());
      setCityInput('');
    } catch {
      setSearchErr('Facility location not found. Try again.');
    }
  };

  const handleAutoLocate = async () => {
    setSearchErr('');
    try {
      await onAutoLocate();
    } catch {
      setSearchErr('Could not auto-detect location.');
    }
  };

  // Render via portal
  return ReactDOM.createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          zIndex: -1,
        }}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 24 }}
        transition={{ type: 'spring', stiffness: 280, damping: 32 }}
        className="vision-card overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.85)',
          boxShadow: '0 32px 80px rgba(15,23,42,0.25), 0 8px 24px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Premium Panel Header */}
        <div className={`bg-gradient-to-br ${cond.gradient} px-8 pt-8 pb-8 relative overflow-hidden transition-all duration-700`}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/50 blur-[60px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/40 blur-[50px] rounded-full -translate-x-1/4 translate-y-1/4 pointer-events-none" />

          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={handleAutoLocate}
              className="p-2 rounded-full vision-glass-light hover:bg-white/90 text-slate-500 transition-all shadow-sm flex items-center justify-center"
              aria-label="Use current location"
              title="Use current location"
            >
              <Map size={16} strokeWidth={2.2} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full vision-glass-light hover:bg-white/90 text-slate-500 transition-all shadow-sm flex items-center justify-center"
              aria-label="Close weather panel"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 bg-white/50 w-max px-3 py-1.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] border border-white/60">
                <MapPin size={12} className="text-slate-600" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                  {location?.city}{location?.state ? `, ${location.state}` : ''}, {location?.country}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${impact.dot} ${searching ? 'animate-pulse bg-blue-500' : 'animate-pulse'} ml-1`} />
              </div>
              <div className="flex items-end gap-5">
                <p className="text-7xl font-mono font-bold text-slate-800 tracking-tighter drop-shadow-sm">{temp}°</p>
                <div className="pb-2.5">
                  <p className="text-2xl font-serif font-bold text-slate-800 tracking-tight">{cond.label}</p>
                  <p className="text-sm text-slate-600 font-medium mt-0.5">Feels like {feelsLike}°C</p>
                </div>
              </div>
            </div>

            <div className="relative pr-2">
              <Icon size={96} className={`${cond.textColor} drop-shadow-lg opacity-90`} strokeWidth={1.2} />
              <div className="absolute inset-0 blur-2xl opacity-30 bg-current rounded-full" />
            </div>
          </div>

          {/* Conditions strip */}
          <div className="relative z-10 flex flex-wrap items-center gap-4 mt-8 p-4 rounded-2xl vision-glass-light border border-white/60 shadow-sm">
            {[
              { icon: Droplets, label: 'Humidity', value: `${humidity}%` },
              { icon: Wind, label: 'Wind', value: `${windSpeed} km/h` },
              { icon: CloudRain, label: 'Rain Prob.', value: `${precipProb}%` },
              { icon: Thermometer, label: 'Apparent', value: `${feelsLike}°C` },
            ].map(({ icon: I, label, value }) => (
              <div key={label} className="flex items-center gap-3 flex-1 min-w-[120px]">
                <div className="p-2.5 rounded-xl bg-white/60 text-slate-600 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                  <I size={16} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                  <p className="text-base font-mono font-bold text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Body */}
        <div className="px-8 py-8 space-y-8">

          {/* Healthcare surge impact */}
          <div className={`relative p-5 rounded-2xl border ${impact.bg} overflow-hidden ${impact.glow} flex items-center gap-5 transition-all hover:shadow-md`}>
            {/* Ambient glow effect inside the card */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-30 ${impact.dot}`} />

            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${impact.dot} shadow-[0_0_8px_currentColor] animate-pulse`} />
                <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${impact.color}`}>Surge Impact Assessment</p>
              </div>
              <p className="text-xl font-serif font-bold text-slate-800 mb-1">{impact.title}</p>
              <p className={`text-sm font-medium ${impact.color} opacity-90`}>{impact.label}</p>
            </div>
            <div className="relative z-10 text-right shrink-0 flex flex-col items-end justify-center pl-4 border-l border-slate-200/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Projected ER Load</span>
              <span className={`text-3xl font-mono font-bold ${impact.color} tracking-tighter`}>{impact.surge}</span>
            </div>
          </div>

          {/* AI Insights */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-indigo-500" />
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Operational Weather Intelligence</p>
            </div>
            <div className="grid gap-3">
              {insights.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative flex items-start gap-3 p-4 rounded-xl vision-glass-light hover:bg-white/80 transition-all border border-slate-200/60 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)]"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-blue-400 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <p className="text-sm font-medium text-slate-700 leading-relaxed font-sans">{msg}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Hourly temp */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">Next 8-Hour Temperature</p>
              <HourlyBars hourly={weather.hourly} field="temperature_2m" isPrecip={false} unit="°" />
            </div>

            {/* Rain probability */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">Precipitation Probability</p>
              <HourlyBars hourly={weather.hourly} field="precipitation_probability" isPrecip={true} unit="%" />
            </div>
          </div>

          {/* City search */}
          <form onSubmit={handleSearch} className="flex gap-3 pt-2">
            <div className="relative flex-1 group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                value={cityInput}
                onChange={e => { setCityInput(e.target.value); setSearchErr(''); }}
                placeholder="Monitor alternate regional facility..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-slate-800 vision-glass-light border border-slate-200/60 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-slate-900/20"
            >
              {searching ? <RefreshCw size={14} className="animate-spin" /> : null}
              Forecast
            </button>
          </form>
          {searchErr && <p className="text-xs text-rose-500 font-medium -mt-4">{searchErr}</p>}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

/* ─── Main WeatherWidget ─────────────────────────────────────────── */
const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const intervalRef = useRef(null);

  const loadWeatherForLocation = useCallback(async (loc) => {
    setLoading(true);
    try {
      const data = await fetchWeather(loc.lat, loc.lon);
      setWeather(data);
      setLocation(loc);
      saveLocation(loc);
      setErrorState(false);
    } catch (err) {
      console.error(err);
      setErrorState(true);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const init = useCallback(async () => {
    try {
      const loc = await fetchLocation();
      await loadWeatherForLocation(loc);
    } catch {
      // Keep loading gracefully if failed
    }
  }, [loadWeatherForLocation]);

  useEffect(() => {
    init();
    intervalRef.current = setInterval(() => {
      if (location) loadWeatherForLocation(location);
    }, 10 * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line

  const handleCitySearch = async (city) => {
    setLoading(true);
    try {
      const newLoc = await geocode(city);
      await loadWeatherForLocation(newLoc);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleAutoLocate = async () => {
    setLoading(true);
    try {
      const newLoc = await fetchCurrentBrowserLocation();
      await loadWeatherForLocation(newLoc);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  return (
    <>
      <WeatherChip
        weather={weather}
        location={location}
        loading={loading}
        errorState={errorState}
        onClick={() => setPanelOpen(true)}
      />
      <AnimatePresence>
        {panelOpen && (
          <WeatherPanel
            weather={weather}
            location={location}
            searching={loading}
            onClose={() => setPanelOpen(false)}
            onCitySearch={handleCitySearch}
            onAutoLocate={handleAutoLocate}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default WeatherWidget;
