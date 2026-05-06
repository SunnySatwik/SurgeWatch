import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud, CloudRain, CloudSnow, Sun, CloudLightning, Wind,
  Droplets, Eye, Thermometer, MapPin, RefreshCw, X,
  TrendingUp, AlertTriangle, Activity, ChevronRight, Search
} from 'lucide-react';

/* ─── Weather code → condition mapping (WMO codes) ──────────────── */
const WMO_MAP = {
  0:  { label: 'Clear Sky',        icon: Sun,           gradient: 'from-amber-100 to-orange-50',  textColor: 'text-amber-600',  risk: 'low' },
  1:  { label: 'Mainly Clear',     icon: Sun,           gradient: 'from-amber-50 to-yellow-50',   textColor: 'text-amber-500',  risk: 'low' },
  2:  { label: 'Partly Cloudy',    icon: Cloud,         gradient: 'from-blue-50 to-slate-50',     textColor: 'text-blue-500',   risk: 'low' },
  3:  { label: 'Overcast',         icon: Cloud,         gradient: 'from-slate-100 to-blue-50',    textColor: 'text-slate-500',  risk: 'moderate' },
  45: { label: 'Foggy',            icon: Cloud,         gradient: 'from-slate-100 to-zinc-50',    textColor: 'text-slate-400',  risk: 'moderate' },
  48: { label: 'Icy Fog',          icon: CloudSnow,     gradient: 'from-blue-100 to-slate-50',    textColor: 'text-blue-400',   risk: 'high' },
  51: { label: 'Light Drizzle',    icon: CloudRain,     gradient: 'from-blue-100 to-indigo-50',   textColor: 'text-blue-500',   risk: 'moderate' },
  53: { label: 'Moderate Drizzle', icon: CloudRain,     gradient: 'from-blue-100 to-indigo-50',   textColor: 'text-blue-600',   risk: 'moderate' },
  55: { label: 'Heavy Drizzle',    icon: CloudRain,     gradient: 'from-indigo-100 to-blue-100',  textColor: 'text-indigo-600', risk: 'high' },
  61: { label: 'Light Rain',       icon: CloudRain,     gradient: 'from-blue-100 to-indigo-50',   textColor: 'text-blue-600',   risk: 'moderate' },
  63: { label: 'Moderate Rain',    icon: CloudRain,     gradient: 'from-indigo-100 to-blue-100',  textColor: 'text-indigo-600', risk: 'high' },
  65: { label: 'Heavy Rain',       icon: CloudRain,     gradient: 'from-indigo-200 to-blue-100',  textColor: 'text-indigo-700', risk: 'critical' },
  71: { label: 'Light Snow',       icon: CloudSnow,     gradient: 'from-sky-100 to-blue-50',      textColor: 'text-sky-500',    risk: 'high' },
  80: { label: 'Rain Showers',     icon: CloudRain,     gradient: 'from-blue-100 to-violet-50',   textColor: 'text-blue-600',   risk: 'high' },
  95: { label: 'Thunderstorm',     icon: CloudLightning,gradient: 'from-violet-100 to-indigo-100',textColor: 'text-violet-700', risk: 'critical' },
};

const getCondition = (code) => WMO_MAP[code] ?? WMO_MAP[2];

const riskImpact = {
  low:      { label: 'Minimal weather impact on surge',          color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500', surge: '+0–2%'  },
  moderate: { label: 'Moderate correlation with ER inflow',      color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100',     dot: 'bg-amber-500',   surge: '+3–8%'  },
  high:     { label: 'Elevated respiratory and trauma risk',      color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-100',   dot: 'bg-orange-500',  surge: '+8–15%' },
  critical: { label: 'High weather-driven surge probability',     color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-100',       dot: 'bg-rose-500',    surge: '+15–25%'},
};

/* ─── API Helpers ────────────────────────────────────────────────── */
const fetchLocation = async () => {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    const d = await res.json();
    return { city: d.city || 'Unknown', lat: d.latitude, lon: d.longitude, country: d.country_code };
  } catch {
    return { city: 'Mumbai', lat: 19.076, lon: 72.877, country: 'IN' };
  }
};

const fetchWeather = async (lat, lon) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m,weather_code` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code` +
    `&timezone=auto&forecast_days=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error('Weather API error');
  return res.json();
};

const geocode = async (city) => {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  const d = await res.json();
  if (!d.results?.length) throw new Error('City not found');
  const r = d.results[0];
  return { city: r.name, lat: r.latitude, lon: r.longitude, country: r.country_code };
};

/* ─── Compact header chip (always visible) ───────────────────────── */
const WeatherChip = ({ weather, location, loading, onClick }) => {
  if (loading) {
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
  const Icon = cond.icon;
  const temp = Math.round(weather.current.temperature_2m);

  return (
    <button
      onClick={onClick}
      className="hidden lg:flex items-center gap-2.5 px-4 py-2 vision-glass-light rounded-xl cursor-pointer hover:bg-white/60 transition-all group"
      title="Open Weather Intelligence"
    >
      <Icon size={16} className={cond.textColor} />
      <div className="text-left">
        <p className="text-xs font-bold text-slate-700 leading-none mb-0.5">{cond.label} · {temp}°C</p>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Met-Signal · {location?.city}</p>
        </div>
      </div>
      <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors ml-1" />
    </button>
  );
};

/* ─── Hourly bar chart ───────────────────────────────────────────── */
const HourlyBars = ({ hourly, field, color, max, unit }) => {
  if (!hourly) return null;
  const now = new Date().getHours();
  const hours = hourly.time.slice(now, now + 8).map((t, i) => ({
    hour: new Date(t).getHours(),
    value: hourly[field]?.[now + i] ?? 0,
  }));
  const peak = Math.max(...hours.map(h => h.value), 1);

  return (
    <div className="flex items-end gap-1.5 h-16">
      {hours.map((h, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[9px] font-mono font-bold text-slate-500">{Math.round(h.value)}{unit}</span>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(h.value / peak) * 48}px` }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
            className={`w-full rounded-t-sm ${color}`}
            style={{ minHeight: 2 }}
          />
          <span className="text-[8px] text-slate-400 font-medium">
            {h.hour === 0 ? '12a' : h.hour < 12 ? `${h.hour}a` : h.hour === 12 ? '12p' : `${h.hour - 12}p`}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── Full expanded panel ────────────────────────────────────────── */
const WeatherPanel = ({ weather, location, onClose, onCitySearch }) => {
  const [cityInput, setCityInput] = useState('');
  const [searching, setSearching] = useState(false);
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
  const impact = riskImpact[cond.risk];
  const temp = Math.round(weather.current.temperature_2m);
  const feelsLike = Math.round(weather.current.apparent_temperature);
  const humidity = weather.current.relative_humidity_2m;
  const windSpeed = Math.round(weather.current.wind_speed_10m);
  const precipProb = weather.current.precipitation_probability;

  const insightMessages = {
    low:      [`Clear conditions minimal ER weather impact today`, `Optimal conditions for scheduled procedures`, `Low environmental health risk`],
    moderate: [`Drizzle correlates with +4% respiratory visits`, `Monitor outdoor-event crowds for trauma risk`, `Humidity may affect COPD patient admissions`],
    high:     [`Rain conditions linked to +12% ER trauma visits`, `Elderly fall risk elevated — prepare orthopedics`, `Humidity spike may trigger asthma surge`],
    critical: [`Severe weather: high-volume surge expected`, `Activate surge capacity protocols`, `All weather-sensitive departments on alert`],
  };
  const insights = insightMessages[cond.risk] ?? insightMessages.low;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setSearching(true);
    setSearchErr('');
    try {
      await onCitySearch(cityInput.trim());
      setCityInput('');
    } catch {
      setSearchErr('City not found. Try again.');
    } finally {
      setSearching(false);
    }
  };

  // Render via portal — escapes ALL stacking contexts (backdrop-filter, transform, overflow-hidden)
  return ReactDOM.createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      // Backdrop — sits at true viewport level, no parent stacking context
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
      {/* Frosted backdrop rendered as a sibling — no filter stacking */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
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
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 32px 80px rgba(15,23,42,0.25), 0 8px 24px rgba(15,23,42,0.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className={`bg-gradient-to-br ${cond.gradient} px-8 pt-8 pb-6 relative`}>
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/40 hover:bg-white/70 text-slate-600 transition-all"
              aria-label="Close weather panel"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={13} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{location?.city}, {location?.country}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-end gap-4">
                <p className="text-6xl font-mono font-bold text-slate-800">{temp}°</p>
                <div className="pb-2">
                  <p className="text-lg font-display font-bold text-slate-700">{cond.label}</p>
                  <p className="text-xs text-slate-500 font-medium">Feels like {feelsLike}°C</p>
                </div>
              </div>
            </div>
            <Icon size={64} className={`${cond.textColor} opacity-60`} />
          </div>

          {/* Conditions strip */}
          <div className="flex flex-wrap items-center gap-5 mt-5">
            {[
              { icon: Droplets,    label: 'Humidity',  value: `${humidity}%` },
              { icon: Wind,        label: 'Wind',       value: `${windSpeed} km/h` },
              { icon: CloudRain,   label: 'Rain Prob.', value: `${precipProb}%` },
              { icon: Thermometer, label: 'Apparent',   value: `${feelsLike}°C` },
            ].map(({ icon: I, label, value }) => (
              <div key={label} className="flex items-center gap-1.5">
                <I size={13} className="text-slate-500" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-mono font-bold text-slate-700">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Body */}
        <div className="px-8 py-6 space-y-6">

          {/* Healthcare surge impact */}
          <div className={`p-4 rounded-2xl border ${impact.bg} flex items-start gap-3`}>
            <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${impact.dot}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-xs font-bold uppercase tracking-widest ${impact.color}`}>Surge Impact Assessment</p>
                <span className={`text-xs font-mono font-bold ${impact.color}`}>{impact.surge}</span>
              </div>
              <p className={`text-sm font-medium ${impact.color}`}>{impact.label}</p>
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <p className="label-meta mb-3">AI Weather Intelligence</p>
            <div className="space-y-2">
              {insights.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100"
                >
                  <Activity size={12} className="text-indigo-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">{msg}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Hourly temp */}
          <div>
            <p className="label-meta mb-3">Next 8-Hour Temperature</p>
            <HourlyBars hourly={weather.hourly} field="temperature_2m" color="bg-blue-400" unit="°" />
          </div>

          {/* Rain probability */}
          <div>
            <p className="label-meta mb-3">Precipitation Probability</p>
            <HourlyBars hourly={weather.hourly} field="precipitation_probability" color="bg-indigo-400" unit="%" />
          </div>

          {/* City search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={cityInput}
                onChange={e => { setCityInput(e.target.value); setSearchErr(''); }}
                placeholder="Search city..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {searching ? <RefreshCw size={13} className="animate-spin" /> : null}
              Update
            </button>
          </form>
          {searchErr && <p className="text-xs text-rose-500 font-medium -mt-3">{searchErr}</p>}
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
  const [error, setError] = useState(false);
  const intervalRef = useRef(null);

  const loadWeather = useCallback(async (loc) => {
    try {
      setError(false);
      const data = await fetchWeather(loc.lat, loc.lon);
      setWeather(data);
    } catch {
      setError(true);
    }
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      const loc = await fetchLocation();
      setLocation(loc);
      await loadWeather(loc);
    } finally {
      setLoading(false);
    }
  }, [loadWeather]);

  useEffect(() => {
    init();
    // Refresh every 10 minutes
    intervalRef.current = setInterval(() => {
      if (location) loadWeather(location);
    }, 10 * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line

  const handleCitySearch = async (city) => {
    const newLoc = await geocode(city);
    setLocation(newLoc);
    await loadWeather(newLoc);
  };

  if (error) return null;

  return (
    <>
      <WeatherChip
        weather={weather}
        location={location}
        loading={loading}
        onClick={() => setPanelOpen(true)}
      />
      <AnimatePresence>
        {panelOpen && (
          <WeatherPanel
            weather={weather}
            location={location}
            onClose={() => setPanelOpen(false)}
            onCitySearch={handleCitySearch}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default WeatherWidget;
