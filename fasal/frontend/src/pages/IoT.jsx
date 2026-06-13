import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Droplets, Sprout, Wifi, WifiOff, Activity, AlertTriangle, Radio, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { supabase } from '../lib/supabase';
import ExplodedIotNode from '../components/ExplodedIotNode';

// Circular gauge component
function CircularGauge({ value, max, unit, color, icon: Icon, label, size = 140 }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle cx={size/2} cy={size/2} r={radius} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          {/* Progress arc */}
          <circle cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${color}66)` }} />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={18} style={{ color }} className="mb-1 opacity-70" />
          <span className="text-2xl font-black text-white tabular-nums">
            {value !== null ? value : '--'}
          </span>
          <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">{unit}</span>
        </div>
      </div>
      <span className="text-xs font-bold text-text-secondary mt-2 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// Status pill component
function StatusPill({ isOnline, secondsAgo }) {
  const timeStr = secondsAgo < 60 ? `${secondsAgo}s ago`
    : secondsAgo < 3600 ? `${Math.floor(secondsAgo / 60)}m ago`
    : `${Math.floor(secondsAgo / 3600)}h ago`;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
      isOnline
        ? 'bg-green-primary/15 text-green-primary border-green-primary/30'
        : 'bg-coral/15 text-coral border-coral/30'
    }`}>
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-primary animate-pulse' : 'bg-coral'}`} />
      {isOnline ? 'LIVE' : 'OFFLINE'}
      <span className="text-text-secondary font-medium">· {timeStr}</span>
    </div>
  );
}

// Stat mini card
function StatCard({ label, value, unit, icon: Icon, trend }) {
  return (
    <div className="surface-card rounded-xl p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-green-primary/15 border border-green-primary/20 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-green-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-white tabular-nums">{value}{unit}</p>
      </div>
      {trend && (
        <div className="ml-auto">
          {trend === 'up' && <TrendingUp size={14} className="text-green-primary" />}
          {trend === 'down' && <TrendingDown size={14} className="text-coral" />}
          {trend === 'stable' && <Minus size={14} className="text-text-secondary" />}
        </div>
      )}
    </div>
  );
}

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const time = new Date(label).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="surface-card rounded-lg p-3 text-xs shadow-xl border border-border">
      <p className="text-text-secondary font-semibold mb-1">{time}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-bold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}{entry.name === 'Soil' ? '%' : entry.name === 'Temp' ? '°C' : '%'}
        </p>
      ))}
    </div>
  );
}

export default function IoT() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // Fetch latest reading from Supabase
  const fetchLatest = async () => {
    try {
      const { data, error: err } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', 'fasal-node-001')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (err) throw err;

      const lastUpdate = new Date(data.created_at);
      const diffMs = Date.now() - lastUpdate.getTime();

      setLatest({
        ...data,
        is_online: diffMs < 120000,
        seconds_ago: Math.floor(diffMs / 1000)
      });
      setError(null);
    } catch (e) {
      console.error('Failed to fetch latest:', e);
      if (!latest) setError('No sensor data yet. Make sure your ESP32 is powered on and connected to WiFi.');
    }
  };

  // Fetch history for charts
  const fetchHistory = async () => {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error: err } = await supabase
        .from('sensor_readings')
        .select('temperature, humidity, soil_moisture, created_at')
        .eq('device_id', 'fasal-node-001')
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (err) throw err;

      const formatted = (data || []).map(d => ({
        time: d.created_at,
        Temp: d.temperature,
        Humidity: d.humidity,
        Soil: d.soil_moisture
      }));
      setHistory(formatted);

      // Compute stats
      if (data && data.length > 0) {
        const temps = data.map(d => d.temperature).filter(Boolean);
        const hums = data.map(d => d.humidity).filter(Boolean);
        const soils = data.map(d => d.soil_moisture).filter(s => s !== null);

        setStats({
          readings: data.length,
          temp: { min: Math.min(...temps), max: Math.max(...temps), avg: +(temps.reduce((a,b) => a+b, 0) / temps.length).toFixed(1) },
          humidity: { min: Math.min(...hums), max: Math.max(...hums), avg: +(hums.reduce((a,b) => a+b, 0) / hums.length).toFixed(1) },
          soil: { min: Math.min(...soils), max: Math.max(...soils), avg: Math.round(soils.reduce((a,b) => a+b, 0) / soils.length) }
        });
      }
    } catch (e) {
      console.error('Failed to fetch history:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLatest(), fetchHistory()]);
      setLoading(false);
    };
    init();

    // Poll every 5 seconds for live feel
    intervalRef.current = setInterval(() => {
      fetchLatest();
    }, 5000);

    // Refresh history every 60 seconds
    const historyInterval = setInterval(fetchHistory, 60000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(historyInterval);
    };
  }, []);

  const temp = latest?.temperature ?? null;
  const humidity = latest?.humidity ?? null;
  const soil = latest?.soil_moisture ?? null;
  const isOnline = latest?.is_online ?? false;
  const soilAlert = soil !== null && soil < 20;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-green-primary/30 border-t-green-primary animate-spin" />
          <p className="text-sm text-text-secondary font-medium">Connecting to IoT Node...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-primary/20 border border-green-primary/30 flex items-center justify-center">
              <Radio size={20} className="text-green-primary" />
            </div>
            IoT Monitor
          </h1>
          <p className="text-sm text-text-secondary mt-1">Live sensor data from your field node</p>
        </div>
        {latest && <StatusPill isOnline={isOnline} secondsAgo={latest.seconds_ago} />}
      </div>

      {/* Error State */}
      {error && !latest && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="surface-card rounded-xl p-6 text-center border-l-4 border-l-amber">
          <WifiOff size={32} className="text-amber mx-auto mb-3" />
          <p className="text-sm text-text-secondary">{error}</p>
        </motion.div>
      )}

      {/* Low Moisture Alert */}
      <AnimatePresence>
        {soilAlert && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-coral/10 border border-coral/30">
            <AlertTriangle size={18} className="text-coral shrink-0 animate-pulse" />
            <p className="text-sm font-semibold text-coral">
              Soil moisture critically low ({soil}%). Consider irrigating immediately.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Hardware Node View */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[500px] lg:h-[600px] w-full mb-6">
        <ExplodedIotNode />
      </motion.div>

      {/* Gauge Cards */}
      {latest && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Temperature */}
          <div className="surface-card rounded-2xl p-6 flex flex-col items-center">
            <CircularGauge value={temp} max={50} unit="°C" color="#ef6a57"
              icon={Thermometer} label="Temperature" />
          </div>

          {/* Humidity */}
          <div className="surface-card rounded-2xl p-6 flex flex-col items-center">
            <CircularGauge value={humidity} max={100} unit="%" color="#3b82f6"
              icon={Droplets} label="Humidity" />
          </div>

          {/* Soil Moisture */}
          <div className={`surface-card rounded-2xl p-6 flex flex-col items-center relative overflow-hidden ${
            soilAlert ? 'border-coral/40' : ''
          }`}>
            {soilAlert && (
              <div className="absolute top-3 right-3">
                <AlertTriangle size={16} className="text-coral animate-pulse" />
              </div>
            )}
            <CircularGauge value={soil} max={100} unit="%" color="#2c9a6d"
              icon={Sprout} label="Soil Moisture" />
          </div>
        </motion.div>
      )}

      {/* 24h Chart */}
      {history.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="surface-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} /> 24-Hour Trend
            </h3>
            <span className="text-[10px] text-text-secondary bg-white/5 px-2 py-1 rounded-full">
              {history.length} readings
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef6a57" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef6a57" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSoil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2c9a6d" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2c9a6d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9bb3a9' }}
                  tickFormatter={(t) => new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} />
                <YAxis tick={{ fontSize: 10, fill: '#9bb3a9' }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Temp" stroke="#ef6a57" fill="url(#gradTemp)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Humidity" stroke="#3b82f6" fill="url(#gradHum)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Soil" stroke="#2c9a6d" fill="url(#gradSoil)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Chart legend */}
          <div className="flex items-center justify-center gap-6 mt-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#ef6a57] rounded" /> Temp</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#3b82f6] rounded" /> Humidity</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#2c9a6d] rounded" /> Soil</span>
          </div>
        </motion.div>
      )}

      {/* 24h Stats Grid */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2 mb-3">
            <Clock size={16} /> 24-Hour Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Avg Temp" value={stats.temp.avg} unit="°C" icon={Thermometer} />
            <StatCard label="Temp Range" value={`${stats.temp.min}-${stats.temp.max}`} unit="°C" icon={Thermometer} />
            <StatCard label="Avg Humidity" value={stats.humidity.avg} unit="%" icon={Droplets} />
            <StatCard label="Avg Soil" value={stats.soil.avg} unit="%" icon={Sprout}
              trend={stats.soil.avg < 20 ? 'down' : stats.soil.avg > 60 ? 'up' : 'stable'} />
          </div>
        </motion.div>
      )}

      {/* Device Info */}
      {latest && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="surface-card rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <Wifi size={14} className={isOnline ? 'text-green-primary' : 'text-coral'} />
            <span>Device: <span className="text-white font-bold">{latest.device_id}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span>Last update: <span className="text-white font-medium">
              {new Date(latest.created_at).toLocaleString('en-IN')}
            </span></span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} />
            <span>Raw soil ADC: <span className="text-white font-medium">{latest.soil_raw}</span></span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
