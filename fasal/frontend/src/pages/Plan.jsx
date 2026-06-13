import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, Sparkles, Check, Leaf } from 'lucide-react';
import api from '../lib/api';
import CropGallery3D from '../components/CropGallery3D';

const LOADING_TEXTS = [
  "Reading your soil profile...",
  "Checking Karnataka weather data...",
  "Analysing 18 viable crops...",
  "Calculating success rates...",
  "Fetching crop photos..."
];

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1592982537447-6f23f739665f?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1586771107445-d3afeb0de06e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=800&auto=format&fit=crop"
];

function getFallbackImage(cropName) {
  const hash = cropName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
}

function SuccessRing({ pct, size = 64, delay = 0 }) {
  const r = (size / 2) - 6, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 75 ? '#1D9E75' : pct >= 65 ? '#EF9F27' : '#EF4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2EAE7" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: `stroke-dashoffset 800ms ease-out ${delay}ms` }} />
      <text x={size/2} y={size/2+5} textAnchor="middle" fontSize={size > 56 ? 16 : 13} fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
}

function CropCard({ crop, index, isRecommended, onSelect, selectedCrop }) {
  const [expanded, setExpanded] = useState(false);
  const [risksOpen, setRisksOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isSelected = selectedCrop === crop.name;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const seasonColors = { excellent: 'bg-green-500/15 text-green-400 border border-green-500/20', good: 'bg-amber-500/15 text-amber-400 border border-amber-500/20', fair: 'bg-red-500/15 text-red-400 border border-red-500/20', poor: 'bg-red-500/15 text-red-400 border border-red-500/20' };
  const seasonLabels = { excellent: '✓ Perfect season', good: '~ Good season', fair: '△ Off-season', poor: '△ Off-season' };
  const waterColors = { low: 'bg-blue-500/15 text-blue-400 border border-blue-500/20', medium: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20', high: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' };
  const demandColors = { high: 'bg-green-500/15 text-green-400 border border-green-500/20', medium: 'bg-white/10 text-white/60 border border-white/10', low: 'bg-red-500/15 text-red-400 border border-red-500/20' };
  const demandIcons = { high: '📈 High demand', medium: '📊 Avg demand', low: '📉 Low demand' };

  return (
    <div className={`bg-bg-card rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${isRecommended ? 'border-2 border-green-primary ring-2 ring-green-primary/20' : 'border border-white/10'} ${!crop.advisable ? 'opacity-75' : ''} ${isSelected ? 'ring-4 ring-green-primary/30' : ''} ${selectedCrop && !isSelected ? 'opacity-50' : ''}`}
      style={{ animationDelay: `${index * 80}ms` }}>
      {isRecommended && <div className="h-[3px] bg-green-primary" />}
      {/* Photo */}
      <div className="h-40 sm:h-[160px] relative overflow-hidden bg-black/30">
        {!imgLoaded && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
        <img 
          src={crop.photo_url || crop.photo_thumb || getFallbackImage(crop.name)} 
          alt={crop.name}
          className={`w-full h-full object-cover transition-opacity duration-500 opacity-100`}
          onLoad={() => setImgLoaded(true)} 
          onError={(e) => { e.target.style.display = 'none'; }} 
        />
        {!crop.advisable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full">NOT ADVISABLE</span>
          </div>
        )}
        {crop.season_fit && (
          <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full ${seasonColors[crop.season_fit] || 'bg-white/10 text-white/60'}`}>
            {seasonLabels[crop.season_fit] || crop.season_fit}
          </span>
        )}
        {isRecommended && <span className="absolute top-2 left-2 bg-green-primary text-white text-[10px] font-bold px-2 py-1 rounded-full">⭐ RECOMMENDED</span>}
        {crop.photo_credit && <span className="absolute bottom-1 right-2 text-[9px] text-white/70">Photo: {crop.photo_credit}</span>}
      </div>
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-white">{crop.name} {crop.kannada_name && <span className="text-[13px] text-text-secondary font-normal">({crop.kannada_name})</span>}</h3>
          </div>
          <div className="flex flex-col items-center flex-shrink-0">
            <SuccessRing pct={crop.success_pct} size={64} delay={index * 80 + 200} />
            <span className="text-[10px] text-text-secondary mt-0.5">success rate</span>
          </div>
        </div>
        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {crop.water_requirement && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${waterColors[crop.water_requirement] || 'bg-blue-500/15 text-blue-400'}`}>💧 {crop.water_requirement} water</span>}
          {crop.market_demand && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${demandColors[crop.market_demand] || 'bg-white/10 text-white/60'}`}>{demandIcons[crop.market_demand] || crop.market_demand}</span>}
        </div>
        {/* Cost */}
        <div>
          <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full text-left">
            <span className="text-base font-semibold text-white">~₹{crop.input_cost_per_acre?.toLocaleString()}/acre</span>
            {!isMobile && (expanded ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />)}
          </button>
          {(expanded || isMobile) && crop.cost_breakdown && (
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-text-secondary bg-white/5 rounded-lg p-3 transition-all">
              <span>Seeds: ₹{crop.cost_breakdown.seeds?.toLocaleString()}</span>
              <span>Fertiliser: ₹{crop.cost_breakdown.fertiliser?.toLocaleString()}</span>
              <span>Pesticide: ₹{crop.cost_breakdown.pesticide?.toLocaleString()}</span>
              <span>Labour: ₹{crop.cost_breakdown.labour?.toLocaleString()}</span>
            </div>
          )}
        </div>
        {/* Yield + Price */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-lg border border-white/5 mt-2">
          <div className="flex flex-col"><span className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Expected Yield</span><span className="font-semibold text-white">{crop.expected_yield_per_acre}</span></div>
          <div className="flex flex-col"><span className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Market Price</span><span className="font-semibold text-white">₹{crop.expected_price_range}/kg</span></div>
        </div>
        <p className="text-xs text-text-secondary">⏱ {crop.duration_weeks} weeks to harvest{crop.best_sowing_window ? ` · Best: ${crop.best_sowing_window}` : ''}</p>
        <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">{crop.reason}</p>
        {/* Risks */}
        {crop.risk_factors?.length > 0 && (
          <div>
            <button onClick={() => setRisksOpen(!risksOpen)} className="text-xs text-amber-400 font-medium hover:underline">
              ⚠ {crop.risk_factors.length} risk factor{crop.risk_factors.length > 1 ? 's' : ''}
            </button>
            {risksOpen && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {crop.risk_factors.map((r, i) => <span key={i} className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">{r}</span>)}
              </div>
            )}
          </div>
        )}
        {/* Select */}
        {!crop.advisable ? (
          <button onClick={() => onSelect(crop, true)} className="w-full py-2.5 border border-white/10 text-text-secondary text-sm font-medium rounded-lg hover:bg-white/5 transition">Not recommended</button>
        ) : (
          <button onClick={() => onSelect(crop, false)} className="w-full py-2.5 bg-green-primary text-white text-sm font-semibold rounded-lg hover:bg-[#0F6E56] transition hover:scale-[1.02] duration-150">
            Select & create plan →
          </button>
        )}
      </div>
    </div>
  );
}

export default function Plan() {
  const navigate = useNavigate();
  const [season, setSeason] = useState(detectSeason());
  const [loading, setLoading] = useState(false);
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);
  const [data, setData] = useState(null);
  const [sortBy, setSortBy] = useState('success');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [selectModal, setSelectModal] = useState(null);
  const [warnModal, setWarnModal] = useState(null);
  const [plantDate, setPlantDate] = useState(new Date().toISOString().split('T')[0]);
  const [plantType, setPlantType] = useState('plan');
  const [profile, setProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [show3DGallery, setShow3DGallery] = useState(false);

  useEffect(() => { api.get('/profile').then(r => setProfile(r.data)).catch(() => {}); }, []);

  // Try loading latest prediction on mount
  useEffect(() => {
    api.get('/predict/latest').then(r => {
      if (r.data.exists) setData(r.data);
    }).catch(() => {});
  }, []);

  // Loading text cycle
  useEffect(() => {
    if (!loading) return;
    const iv = setInterval(() => setLoadingTextIdx(i => (i + 1) % LOADING_TEXTS.length), 1500);
    return () => clearInterval(iv);
  }, [loading]);

  const runPrediction = async () => {
    setLoading(true); setLoadingTextIdx(0); setData(null); setSelectedCrop(null);
    try {
      const res = await api.post('/predict', { season });
      setData(res.data);
    } catch (e) {
      // Retry once
      try {
        await new Promise(r => setTimeout(r, 2000));
        const res = await api.post('/predict', { season });
        setData(res.data);
      } catch (e2) {
        alert('AI analysis failed. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleSelect = (crop, isWarning) => {
    if (isWarning) { setWarnModal(crop); return; }
    setSelectModal(crop); setSelectedCrop(crop.name);
  };

  const confirmSelect = async () => {
    if (!selectModal || !data?.prediction_id) return;
    setSubmitting(true);
    try {
      await api.patch(`/predict/${data.prediction_id}/select`, { crop_name: selectModal.name, planting_date: plantDate });
      await api.post('/timeline', { prediction_id: data.prediction_id, crop: selectModal.name, planting_date: plantDate });
      navigate('/dashboard/grow');
    } catch (e) { alert('Failed: ' + (e.response?.data?.error || e.message)); }
    setSubmitting(false);
  };

  const sorted = data?.crops ? [...data.crops].sort((a, b) => {
    if (sortBy === 'cost') return (a.input_cost_per_acre || 0) - (b.input_cost_per_acre || 0);
    if (sortBy === 'duration') return (a.duration_weeks || 0) - (b.duration_weeks || 0);
    return (b.success_pct || 0) - (a.success_pct || 0);
  }) : [];

  // ── EMPTY STATE ──
  if (!data && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-32 h-32 mb-6 rounded-full glass-panel flex items-center justify-center border border-green-primary/20 shadow-[0_0_30px_rgba(29,158,117,0.15)]">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none"><rect x="10" y="50" width="60" height="8" rx="4" fill="rgba(29,158,117,0.2)"/><rect x="20" y="42" width="40" height="8" rx="4" fill="rgba(29,158,117,0.4)"/><path d="M40 10 C40 10 25 25 25 35 C25 45 35 50 40 50 C45 50 55 45 55 35 C55 25 40 10 40 10Z" fill="#1D9E75" opacity="0.8"/><path d="M40 20 C40 20 32 30 32 36 C32 42 36 45 40 45" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none" opacity="0.5"/></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Ready to find your best crop?</h2>
        <p className="text-text-secondary mb-6 max-w-md">We'll analyse your soil, weather, and season to rank every viable crop for your farm.</p>
        <div className="space-y-2 text-left mb-8">
          {['12 crops ranked by success rate', 'Real input cost estimates', 'Week-by-week growing plan included'].map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-text-primary"><Check size={16} className="text-green-primary flex-shrink-0" /><span>{t}</span></div>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <select value={season} onChange={e => setSeason(e.target.value)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-green-primary">
            <option className="bg-bg-card">Kharif 2026</option><option className="bg-bg-card">Rabi 2026-27</option><option className="bg-bg-card">Zaid 2026</option>
          </select>
          <button onClick={runPrediction} className="glass-button px-8 py-3 font-semibold rounded-xl text-base flex items-center gap-2 shadow-[0_0_15px_rgba(29,158,117,0.2)]">
            <Sparkles size={18} /> Analyse my farm
          </button>
        </div>
        <p className="text-[10px] text-text-secondary mt-4">Powered by Groq AI</p>
      </div>
    );
  }

  // ── LOADING STATE ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-green-primary/20 rounded-full animate-ping" />
          <div className="absolute inset-2 border-4 border-green-primary rounded-full animate-spin" style={{ borderTopColor: 'transparent' }} />
          <div className="absolute inset-0 flex items-center justify-center"><Leaf className="text-green-primary animate-pulse drop-shadow-[0_0_10px_rgba(29,158,117,0.8)]" size={32} /></div>
        </div>
        <p className="text-lg font-semibold text-white h-7 transition-all">{LOADING_TEXTS[loadingTextIdx]}</p>
        <p className="text-sm text-text-secondary mt-2">This takes about 5 seconds</p>
      </div>
    );
  }

  // ── RESULTS STATE ──
  return (
    <div className="space-y-5">
      {/* Header + controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Stage 1 — Plan your crop</h1>
          <p className="text-[#5A7068] text-sm mt-1">AI ranks crops by agronomic success for your farm</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={season} onChange={e => setSeason(e.target.value)} className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-green-primary">
            <option className="bg-bg-card text-white">Kharif 2026</option><option className="bg-bg-card text-white">Rabi 2026-27</option><option className="bg-bg-card text-white">Zaid 2026</option>
          </select>
          <button onClick={runPrediction} disabled={loading} className="px-5 py-2 bg-green-primary text-white font-semibold rounded-lg text-sm hover:bg-[#0F6E56] transition flex items-center gap-2 disabled:opacity-50">
            <Sparkles size={16} /> Re-analyse
          </button>
        </div>
      </div>

      {/* Weather chips */}
      {data.weather && (
        <div className="flex gap-2 flex-wrap mb-2">
          <span className="bg-amber-500/15 text-amber-400 text-xs font-medium px-4 py-1.5 rounded-full border border-amber-500/20">🌡 {data.weather.temp_avg}°C</span>
          <span className="bg-blue-500/15 text-blue-400 text-xs font-medium px-4 py-1.5 rounded-full border border-blue-500/20">💧 {data.weather.humidity}% humidity</span>
          <span className="bg-blue-500/15 text-blue-400 text-xs font-medium px-4 py-1.5 rounded-full border border-blue-500/20">🌧 {data.weather.rainfall_30d}mm last 30d</span>
          <span className="bg-green-500/15 text-green-400 text-xs font-medium px-4 py-1.5 rounded-full border border-green-500/20">🌱 {profile?.soil_type}</span>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#5A7068]">{sorted.length} crops analysed for {profile?.district}</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-green-primary">
          <option value="success" className="bg-bg-card text-white">Success %</option><option value="cost" className="bg-bg-card text-white">Input cost</option><option value="duration" className="bg-bg-card text-white">Duration</option>
        </select>
      </div>

      {/* Plan Insights Panel */}
      {(data.recommended || data.season_note || data.soil_health_note) && (
        <div className="bg-bg-card border border-white/10 rounded-xl p-5 mb-2 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Sparkles size={16} className="text-amber-400" /> Agronomic Insights</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {data.recommended && (
              <div className="bg-white/5 p-3.5 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-primary">⭐</span>
                  <span className="text-xs font-semibold text-white uppercase tracking-wide">Top Pick</span>
                </div>
                <p className="text-sm font-medium text-green-400">{data.recommended}</p>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{data.recommended_reason}</p>
              </div>
            )}
            {data.season_note && (
              <div className="bg-white/5 p-3.5 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-400">📅</span>
                  <span className="text-xs font-semibold text-white uppercase tracking-wide">Season</span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-3">{data.season_note}</p>
              </div>
            )}
            {data.soil_health_note && (
              <div className="bg-white/5 p-3.5 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400">🌿</span>
                  <span className="text-xs font-semibold text-white uppercase tracking-wide">Soil</span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-3">{data.soil_health_note}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Crop grid (Top 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {sorted.slice(0, 4).map((crop, i) => (
          <CropCard key={crop.name} crop={crop} index={i} isRecommended={crop.name === data.recommended}
            onSelect={handleSelect} selectedCrop={selectedCrop} />
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <button 
          onClick={() => setShow3DGallery(true)}
          className="px-8 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition flex items-center gap-2"
        >
          <Sparkles size={18} className="text-green-primary" /> 
          {sorted.length > 4 ? `Explore ${sorted.length - 4} more crops in 3D Gallery` : 'Explore crops in 3D Gallery'}
        </button>
      </div>

      {/* 3D Crop Gallery Overlay */}
      {show3DGallery && (
        <CropGallery3D 
          crops={sorted} 
          onClose={() => setShow3DGallery(false)}
          renderCard={(crop, i) => (
            <CropCard 
              key={crop.name} 
              crop={crop} 
              index={i} 
              isRecommended={crop.name === data.recommended}
              onSelect={handleSelect} 
              selectedCrop={selectedCrop} 
            />
          )} 
        />
      )}

      {/* Warning modal */}
      {warnModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center gap-2 text-amber-400"><AlertTriangle size={20} /><h3 className="font-bold text-white">Low success rate</h3></div>
            <p className="text-sm text-text-secondary">This crop has a <strong className="text-white">{warnModal.success_pct}%</strong> success rate for your farm. Are you sure?</p>
            <div className="flex gap-3">
              <button onClick={() => setWarnModal(null)} className="flex-1 py-2.5 border border-white/10 rounded-lg text-sm text-text-secondary hover:bg-white/5">Cancel</button>
              <button onClick={() => { setSelectModal(warnModal); setSelectedCrop(warnModal.name); setWarnModal(null); }} className="flex-1 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600">Yes, select anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* Select + planting modal */}
      {selectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-bg-card rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 w-full sm:max-w-md shadow-2xl space-y-5 border border-white/10">
            <h3 className="text-xl font-bold text-white">Great choice! When did / will you plant?</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer text-text-primary">
                <input type="radio" name="pt" value="plan" checked={plantType==='plan'} onChange={() => setPlantType('plan')} className="accent-green-primary" /> I plan to plant
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-text-primary">
                <input type="radio" name="pt" value="planted" checked={plantType==='planted'} onChange={() => setPlantType('planted')} className="accent-green-primary" /> I already planted
              </label>
              <input type="date" value={plantDate} onChange={e => setPlantDate(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-primary" />
            </div>
            <div className="bg-white/5 rounded-xl p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-text-secondary">Crop</span><span className="font-medium text-white">{selectModal.name}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Input cost</span><span className="font-medium text-white">~₹{selectModal.input_cost_per_acre?.toLocaleString()}/acre</span></div>
              {profile?.farm_size && <div className="flex justify-between"><span className="text-text-secondary">Total ({profile.farm_size} acres)</span><span className="font-semibold text-white">~₹{(selectModal.input_cost_per_acre * profile.farm_size).toLocaleString()}</span></div>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSelectModal(null); setSelectedCrop(null); }} className="px-5 py-3 border border-white/10 rounded-xl text-sm text-text-secondary hover:bg-white/5">Cancel</button>
              <button onClick={confirmSelect} disabled={submitting} className="flex-1 py-3 bg-green-primary text-white font-semibold rounded-xl hover:bg-[#0F6E56] transition disabled:opacity-50 text-sm">
                {submitting ? 'Creating plan...' : 'Create my growing plan →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function detectSeason() {
  const m = new Date().getMonth() + 1, y = new Date().getFullYear();
  if (m >= 6 && m <= 10) return `Kharif ${y}`;
  if (m >= 11 || m <= 3) return `Rabi ${y}-${(y+1)%100}`;
  return `Zaid ${y}`;
}
