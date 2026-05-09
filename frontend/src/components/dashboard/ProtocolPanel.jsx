import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, ShieldAlert, ShieldCheck, ShieldOff,
  Zap, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Activity
} from 'lucide-react';
import { fetchProtocols, activateProtocol, deactivateProtocol, fetchAlerts } from '../../utils/operationsService';

const statusConfig = {
  active: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: ShieldAlert, label: 'ACTIVE', pulse: true },
  cooldown: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Clock, label: 'COOLDOWN', pulse: false },
  standby: { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: ShieldCheck, label: 'STANDBY', pulse: false },
};

const ProtocolCard = ({ protocol, onActivate, onDeactivate, isLoading }) => {
  const config = statusConfig[protocol.status] || statusConfig.standby;
  const StatusIcon = config.icon;
  const actions = typeof protocol.actions === 'string' ? JSON.parse(protocol.actions) : (protocol.actions || []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`vision-card glass-reflection p-5 relative overflow-hidden transition-all duration-500 ${protocol.status === 'active' ? 'ring-1 ring-red-200' : ''}`}
    >
      {/* Active glow */}
      {protocol.status === 'active' && (
        <motion.div
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-red-500/10 pointer-events-none"
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${config.bg} relative`}>
            <StatusIcon size={18} className={config.color} />
            {config.pulse && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 tracking-tight">{protocol.name}</h4>
            <p className="text-[10px] font-mono text-slate-400 uppercase">{protocol.code}</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${config.bg} ${config.color} ${config.border}`}>
          {config.label}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed mb-3 relative z-10">{protocol.description}</p>

      {/* Actions list */}
      {protocol.status === 'active' && actions.length > 0 && (
        <div className="mb-3 relative z-10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Active Directives</p>
          <div className="space-y-1.5">
            {actions.slice(0, 3).map((action, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight size={12} className="text-red-400 mt-0.5 shrink-0" />
                <span className="text-[11px] text-slate-600 leading-snug">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activation info */}
      {protocol.last_trigger_reason && (
        <div className="text-[10px] text-slate-400 mb-3 relative z-10">
          <span className="font-semibold">Last trigger:</span> {protocol.last_trigger_reason}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 relative z-10">
        {protocol.status === 'standby' && (
          <button
            onClick={() => onActivate(protocol.id)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold transition-all disabled:opacity-50"
          >
            <Zap size={12} /> Activate Protocol
          </button>
        )}
        {protocol.status === 'active' && (
          <button
            onClick={() => onDeactivate(protocol.id)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold transition-all disabled:opacity-50"
          >
            <ShieldOff size={12} /> Stand Down
          </button>
        )}
        {protocol.status === 'cooldown' && (
          <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-500 text-xs font-medium">
            <Clock size={12} /> Cooling down...
          </div>
        )}
      </div>

      {/* Activation count */}
      {protocol.activation_count > 0 && (
        <div className="mt-2 text-right relative z-10">
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
            {protocol.activation_count} activation{protocol.activation_count !== 1 ? 's' : ''} total
          </span>
        </div>
      )}
    </motion.div>
  );
};

const AlertItem = ({ alert, compact = false }) => {
  const severityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 py-2"
    >
      <div className="mt-1.5 relative">
        <div className={`w-2.5 h-2.5 rounded-full ${severityColors[alert.severity] || 'bg-slate-400'}`} />
        {alert.status === 'active' && alert.severity === 'critical' && (
          <span className="absolute -top-0.5 -left-0.5 flex h-3.5 w-3.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${severityColors[alert.severity]} opacity-40`} />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 truncate">{alert.title}</span>
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
            alert.status === 'active' ? 'bg-red-50 text-red-600' :
            alert.status === 'acknowledged' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
          }`}>
            {alert.status}
          </span>
        </div>
        {!compact && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{alert.message}</p>}
        <p className="text-[9px] text-slate-400 font-mono mt-1">
          {new Date(alert.created_at).toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
};

const ProtocolPanel = () => {
  const [protocols, setProtocols] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const loadData = async () => {
    try {
      const [protocolRes, alertRes] = await Promise.all([
        fetchProtocols(),
        fetchAlerts(1, null, 10)
      ]);
      if (protocolRes.success) setProtocols(protocolRes.protocols);
      if (alertRes.success) setAlerts(alertRes.alerts);
    } catch (err) {
      console.error('Failed to load protocol data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleActivate = async (protocolId) => {
    setActionLoading(true);
    try {
      const result = await activateProtocol(protocolId);
      if (result.success) {
        setToast({ type: 'warning', message: `Protocol activated: ${result.protocol.name}` });
        await loadData();
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Activation failed' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDeactivate = async (protocolId) => {
    setActionLoading(true);
    try {
      const result = await deactivateProtocol(protocolId);
      if (result.success) {
        setToast({ type: 'success', message: `Protocol stood down: ${result.protocol.name}` });
        await loadData();
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Deactivation failed' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const activeProtocols = protocols.filter(p => p.status === 'active');
  const standbyProtocols = protocols.filter(p => p.status !== 'active');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <Activity size={20} className="animate-pulse" />
          <span className="text-sm font-medium">Loading protocol state...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0 pb-20 font-sans">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[200]"
          >
            <div className={`px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold border ${
              toast.type === 'warning' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {toast.type === 'warning' ? <AlertTriangle size={16} /> :
               toast.type === 'error' ? <ShieldOff size={16} /> :
               <CheckCircle2 size={16} />}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT: Protocol Cards */}
      <div className="lg:col-span-8 flex flex-col gap-5 min-w-0">
        {/* Summary bar */}
        <div className="vision-card glass-reflection p-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-indigo-500" />
            <span className="text-sm font-bold text-slate-800">Surge Protocols</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-600">{activeProtocols.length} Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-xs font-bold text-slate-400">{standbyProtocols.length} Standby</span>
            </div>
          </div>
        </div>

        {/* Active protocols first */}
        {activeProtocols.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShieldAlert size={14} /> Active Protocols
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProtocols.map(p => (
                <ProtocolCard key={p.id} protocol={p} onActivate={handleActivate} onDeactivate={handleDeactivate} isLoading={actionLoading} />
              ))}
            </div>
          </div>
        )}

        {/* Standby protocols */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ShieldCheck size={14} /> Available Protocols
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {standbyProtocols.map(p => (
              <ProtocolCard key={p.id} protocol={p} onActivate={handleActivate} onDeactivate={handleDeactivate} isLoading={actionLoading} />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Alert Feed */}
      <div className="lg:col-span-4 flex flex-col gap-5 min-w-0">
        <div className="vision-card glass-reflection p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-display font-bold text-slate-800">Alert History</h3>
            <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {alerts.filter(a => a.status === 'active').length} active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-1 divide-y divide-slate-100">
            <AnimatePresence>
              {alerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </AnimatePresence>
            {alerts.length === 0 && (
              <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                No alerts recorded
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolPanel;
