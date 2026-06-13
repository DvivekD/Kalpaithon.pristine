import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, TrendingUp, TrendingDown, Minus, ExternalLink, MapPin, AlertCircle, CheckCircle2, Phone, Navigation2, PackageSearch } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../lib/api';
import BuyerMap3D from '../components/BuyerMap3D';

function ScoreGauge({ score, total, color }) {
  // 0-100 mapped to -90 to 90 degrees
  const angle = -90 + (total / 100) * 180;
  // STORE = red (low score, left), WAIT = amber (mid), SELL = green (high, right)
  const scoreColors = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' };
  const fillColor = scoreColors[color] || '#22C55E';
  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
        {/* STORE zone (red) — left third */}
        <path d="M 20 100 A 80 80 0 0 1 60 30" fill="none" stroke="#EF4444" strokeWidth="14" strokeLinecap="round" opacity="0.6" />
        {/* WAIT zone (amber) — middle third */}
        <path d="M 60 30 A 80 80 0 0 1 140 30" fill="none" stroke="#F59E0B" strokeWidth="14" strokeLinecap="round" opacity="0.6" />
        {/* SELL zone (green) — right third */}
        <path d="M 140 30 A 80 80 0 0 1 180 100" fill="none" stroke="#22C55E" strokeWidth="14" strokeLinecap="round" opacity="0.6" />
        {/* Zone labels */}
        <text x="35" y="90" fill="#EF4444" fontSize="8" fontWeight="800" textAnchor="middle" opacity="0.7">STORE</text>
        <text x="100" y="22" fill="#F59E0B" fontSize="8" fontWeight="800" textAnchor="middle" opacity="0.7">WAIT</text>
        <text x="165" y="90" fill="#22C55E" fontSize="8" fontWeight="800" textAnchor="middle" opacity="0.7">SELL</text>
        {/* Needle */}
        <line className="gauge-needle" x1="100" y1="100" x2="100" y2="30"
          stroke={fillColor} strokeWidth="3" strokeLinecap="round"
          style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px' }} />
        <circle cx="100" cy="100" r="6" fill={fillColor} />
      </svg>
      <div className="text-3xl font-extrabold mt-2" style={{ color: fillColor }}>{score}</div>
      <div className="text-sm text-text-secondary">Score: {total}/100</div>
    </div>
  );
}

export default function Sell() {
  const [quantity, setQuantity] = useState('');
  const [daysStored, setDaysStored] = useState(0);
  const [costBreakdown, setCostBreakdown] = useState({ seeds: '', water: '', fertilizer: '', labor: '' });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const calculate = async () => {
    console.log('Calculating sell window...');
    setLoading(true);
    try {
      const res = await api.post('/sell', { 
        quantity_kg: parseFloat(quantity), 
        days_stored: daysStored,
        cost_breakdown: {
          seeds: parseFloat(costBreakdown.seeds) || 0,
          water: parseFloat(costBreakdown.water) || 0,
          fertilizer: parseFloat(costBreakdown.fertilizer) || 0,
          labor: parseFloat(costBreakdown.labor) || 0
        }
      });
      console.log('Calculation response:', res.data);
      setData(res.data);
      
      localStorage.setItem('t35_sync', JSON.stringify({
        seeds: costBreakdown.seeds,
        water: costBreakdown.water,
        fertilizer: costBreakdown.fertilizer,
        labor: costBreakdown.labor,
        sellingPrice: res.data.gross_revenue,
        quantity: quantity,
        score: res.data.score,
        data_source: res.data.data_source,
        latitude: res.data.latitude,
        longitude: res.data.longitude
      }));
    } catch (e) {
      console.error('Calculation error:', e);
      alert('Sell analysis failed: ' + (e.response?.data?.error || e.message));
    }
    setLoading(false);
  };

  const handleCostChange = (field, val) => {
    setCostBreakdown(prev => ({ ...prev, [field]: val }));
  };

  // Group price chart by mandi for Recharts
  const chartData = data ? (() => {
    const byDate = {};
    if (!data.price_chart || !Array.isArray(data.price_chart)) return [];
    data.price_chart.forEach(p => {
      if (!p || !p.date) return;
      if (!byDate[p.date]) byDate[p.date] = { date: p.date.slice(5) };
      byDate[p.date][p.mandi_name] = p.price;
    });
    return Object.values(byDate);
  })() : [];
  const mandiNames = data ? [...new Set(data.price_chart.map(p => p.mandi_name))] : [];
  const lineColors = ['#1D9E75', '#EF9F27', '#E8593C'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stage 3 — Sell Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Score your sell window. Maximize profit.</p>
        </div>
        <Link to="/challenge/t35" className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded tracking-widest uppercase transition-colors">
          View Task T35 Demo
        </Link>
      </div>

      {/* Input row */}
      <div className="glass-panel rounded-xl border border-white/5 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-black text-text-secondary uppercase mb-1.5 ml-1">Quantity (kg)</label>
            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
              className="px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg w-full font-bold text-white focus:outline-none focus:border-green-primary" placeholder="e.g. 400" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-text-secondary uppercase mb-1.5 ml-1">Days stored: {daysStored}</label>
            <input type="range" min="0" max="14" value={daysStored} onChange={e => setDaysStored(parseInt(e.target.value))}
              className="w-full mt-3" />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <label className="block text-sm font-bold mb-3 text-white">Optional: Cost Breakdown (T35 Task)</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <CostInputSmall label="Seeds" value={costBreakdown.seeds} onChange={val => handleCostChange('seeds', val)} />
            <CostInputSmall label="Water" value={costBreakdown.water} onChange={val => handleCostChange('water', val)} />
            <CostInputSmall label="Fertilizer" value={costBreakdown.fertilizer} onChange={val => handleCostChange('fertilizer', val)} />
            <CostInputSmall label="Labor" value={costBreakdown.labor} onChange={val => handleCostChange('labor', val)} />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={calculate} disabled={loading || !quantity}
            className="glass-button px-8 py-3 font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(29,158,117,0.3)]">
            {loading ? <><Loader2 className="animate-spin" size={18} /> Calculating...</> : 'Calculate Sell Window'}
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Top section: Score Gauge */}
          <div className="bg-bg-card rounded-xl border border-border p-8 flex flex-col items-center">
            <ScoreGauge score={data.score} total={data.score_total} color={data.score_color} />
            <p className="text-sm text-text-secondary mt-3 text-center max-w-md">{data.reason}</p>
            
            {/* T35 Profit Margin Analysis */}
            <div className={`mt-6 w-full max-w-md p-4 rounded-xl border flex items-center gap-4 ${data.margin_pct < 10 ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
               <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${data.margin_pct < 10 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                 {data.margin_pct < 10 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
               </div>
               <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-0.5">Profit Margin</p>
                  <p className={`text-sm font-bold ${data.margin_pct < 10 ? 'text-red-400' : 'text-green-400'}`}>
                    {data.margin_pct < 10 
                      ? `Low Profit Margin (${data.margin_pct}%). Consider waiting for better prices.` 
                      : (data.score === 'WAIT' || data.score === 'STORE')
                        ? `Good margin (${data.margin_pct}%), but market says ${data.score}. Hold for better returns.` 
                        : `Good margin (${data.margin_pct}%). Recommended to sell now.`}
                  </p>
               </div>
            </div>

            {data.wait_gain_3days > 0 && (
              <span className="mt-2 bg-green-light text-green-dark text-xs font-semibold px-3 py-1 rounded-full">
                Wait 3 more days: +₹{data.wait_gain_3days.toLocaleString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Price Trend Chart */}
            <div className="bg-bg-card rounded-xl border border-border p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">14-Day Price Trend</h3>
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  data.trend_direction === 'up' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : data.trend_direction === 'down' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-white/10 text-white/60 border border-white/10'
                }`}>
                  {data.trend_direction === 'up' ? <TrendingUp size={14} /> : data.trend_direction === 'down' ? <TrendingDown size={14} /> : <Minus size={14} />}
                  {data.trend_pct > 0 ? '+' : ''}{data.trend_pct}%
                </span>
              </div>
              <div className="text-xs text-text-secondary mb-2">{data.data_source === 'estimated' ? '⚡ Estimated data' : '✅ Live data'}</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8B9D96' }} stroke="rgba(255,255,255,0.1)" />
                  <YAxis tick={{ fontSize: 11, fill: '#8B9D96' }} stroke="rgba(255,255,255,0.1)" />
                  <Tooltip contentStyle={{ backgroundColor: '#0D1517', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F3F4F6' }} />
                  {mandiNames.map((name, i) => (
                    <Line key={name} type="monotone" dataKey={name} stroke={lineColors[i]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Net Profit Breakdown */}
            <div className="accent-card green p-5 space-y-3">
              <h3 className="font-bold text-sm">Net Profit Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">Market price</span><span className="font-bold">₹{data.suggested_selling_price}/kg</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Gross revenue</span><span>₹{data.gross_revenue?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Transport cost</span><span className="text-coral">-₹{data.transport_cost?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Input cost</span><span className="text-coral">-₹{data.input_cost?.toLocaleString()}</span></div>
                {data.storage_cost > 0 && <div className="flex justify-between"><span className="text-text-secondary">Storage cost</span><span className="text-coral">-₹{data.storage_cost?.toLocaleString()}</span></div>}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-bold">NET PROFIT</span>
                  <span className={`text-lg font-bold ${data.net_profit >= 0 ? 'text-success' : 'text-danger'}`}>₹{data.net_profit?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mandi Comparison */}
          <div className="bg-bg-card rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-4">Mandi Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-left">
                    <th className="pb-3 font-medium">Mandi</th>
                    <th className="pb-3 font-medium">Distance</th>
                    <th className="pb-3 font-medium">Today's Price</th>
                    <th className="pb-3 font-medium">Transport</th>
                    <th className="pb-3 font-medium">Net/Quintal</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.mandis.map((m, i) => (
                    <tr key={i} className={`border-b border-border ${m.name === data.best_mandi ? 'bg-green-light/30' : ''}`}>
                      <td className="py-3 font-medium">{m.name} {m.name === data.best_mandi && <span className="text-[10px] bg-green-primary text-white px-1.5 py-0.5 rounded-full ml-1">BEST</span>}</td>
                      <td className="py-3 text-text-secondary">{m.distance_km} km</td>
                      <td className="py-3 flex items-center gap-1">
                        ₹{m.price_today}/kg
                        {m.trend === 'up' ? <TrendingUp size={12} className="text-success" /> : m.trend === 'down' ? <TrendingDown size={12} className="text-danger" /> : null}
                      </td>
                      <td className="py-3 text-text-secondary">₹{m.transport_cost}</td>
                      <td className="py-3 font-semibold">₹{m.net_per_quintal}/q</td>
                      <td className="py-3">
                        <a href={`https://maps.google.com/?daddr=${m.lat},${m.lon}`} target="_blank" rel="noreferrer"
                          className="text-green-primary hover:underline flex items-center gap-1 text-xs">
                          <MapPin size={12} /> Directions
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buyer Finder */}
          <BuyerSection profileLat={data.latitude} profileLon={data.longitude} />
        </>
      )}
    </div>
  );
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function BuyerSection({ profileLat, profileLon }) {
  const [allBuyers, setAllBuyers] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [sensorStatus, setSensorStatus] = useState('STABLE');

  useEffect(() => {
    const i = setInterval(() => {
      const statuses = ['STABLE', 'SYNCING', 'ACTIVE', 'SCANNING'];
      setSensorStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 3000);
    return () => clearInterval(i);
  }, []);

  const loadBuyers = async () => {
    setLoading(true);
    setScanning(true);
    try {
      const res = await api.get('/buyers'); 
      setAllBuyers(res.data.buyers);
    } catch (e) {
      setAllBuyers([]);
    }
    setTimeout(() => {
      setLoading(false);
      setScanning(false);
    }, 1500); // Radar scan effect
  };

  useEffect(() => {
    if (profileLat && profileLon && !allBuyers && !loading) {
      loadBuyers();
    }
  }, [profileLat, profileLon]);

  const filteredBuyers = allBuyers?.filter(b => filter === 'ALL' || b.type === filter) || [];

  return (
    <div className="mt-8 bg-[#0D1517] rounded-3xl overflow-hidden border border-[#1D9E75]/30 shadow-2xl">
      {/* Terminal Header */}
      <div className="bg-[#1D9E75]/10 border-b border-[#1D9E75]/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
          <span className="text-[10px] font-black text-[#1D9E75] uppercase tracking-[0.2em]">Fasal Terminal — Buyer Map v2.1</span>
        </div>
        {!allBuyers && (
          <button onClick={loadBuyers} disabled={loading}
            className="px-6 py-2 bg-[#1D9E75] text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#157A5B] transition-all disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
            Initialize Scan
          </button>
        )}
        {allBuyers && (
          <div className="flex gap-2">
            {['ALL', 'HOTEL', 'FPO', 'RETAIL', 'AGGREGATOR'].map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all border ${filter === cat ? 'bg-[#1D9E75] border-[#1D9E75] text-white' : 'border-[#1D9E75]/20 text-[#1D9E75]/60 hover:border-[#1D9E75]/40'}`}>
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {!allBuyers ? (
        <div className="h-[500px] flex flex-col items-center justify-center bg-radial-dots">
          <div className="w-20 h-20 border-4 border-[#1D9E75]/20 border-t-[#1D9E75] rounded-full animate-spin mb-6" />
          <p className="text-[#1D9E75] text-xs font-black uppercase tracking-widest opacity-50">Satellite Link Offline</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row h-[600px]">
          {/* Radar View 3D (Center) */}
          <div className="flex-1 relative bg-[#0D1517] border-r border-[#1D9E75]/10">
            <BuyerMap3D buyers={filteredBuyers} profileLat={profileLat} profileLon={profileLon} />
            {/* Bottom Info Overlay */}
            <div className="absolute bottom-4 left-6 right-6 flex justify-between text-[10px] font-mono text-[#1D9E75]/60 uppercase pointer-events-none z-10">
               <span>RADAR_SCAN: ACTIVE (200KM)</span>
               <span>HITS: {filteredBuyers.length}</span>
               <span>SENSORS: {sensorStatus}</span>
            </div>
          </div>

          {/* Directory Panel (Right) */}
          <div className="w-full lg:w-[400px] bg-[#0A0F11] flex flex-col">
            <div className="px-6 py-4 border-b border-[#1D9E75]/10 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Buyer Directory</h3>
              <span className="text-[9px] text-[#1D9E75]/50 font-mono">SORT: DISTANCE</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredBuyers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <PackageSearch size={32} className="text-[#1D9E75] mb-2" />
                  <p className="text-[10px] font-bold">NO MATCHES IN AREA</p>
                </div>
              ) : filteredBuyers.map((b, i) => (
                <div key={i} className="group bg-[#0D1517] border border-[#1D9E75]/10 rounded-xl p-4 transition-all hover:border-[#1D9E75]/40 hover:bg-[#121E20]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                          b.type === 'HOTEL' ? 'bg-amber-500/20 text-amber-500' : 
                          b.type === 'FPO' ? 'bg-blue-500/20 text-blue-500' : 
                          'bg-green-500/20 text-green-500'
                        }`}>{b.type}</span>
                        <span className="text-[9px] font-bold text-[#1D9E75]/60">{b.distance_km} KM</span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#1D9E75] transition-colors">{b.name}</h4>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-[#5A7068] mb-4 line-clamp-1">{b.address || 'Address on file'}</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => b.phone && (window.location.href = `tel:${b.phone}`)}
                      disabled={!b.phone}
                      className="flex items-center justify-center gap-2 py-2 bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-lg text-[10px] font-black text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white transition-all disabled:opacity-20">
                      <Phone size={12} /> CONTACT
                    </button>
                    <a href={`https://maps.google.com/?daddr=${b.lat},${b.lon}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 py-2 bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-lg text-[10px] font-black text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white transition-all">
                      <Navigation2 size={12} /> ROUTE
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CostInputSmall({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1 ml-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">₹</span>
        <input 
          type="number" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full pl-6 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm font-semibold text-white focus:ring-1 focus:ring-green-primary outline-none"
        />
      </div>
    </div>
  );
}
