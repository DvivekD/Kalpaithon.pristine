import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, ChevronRight, ChevronDown, ChevronUp, CloudRain, PartyPopper, Loader2, Satellite, TrendingUp, Eye, Camera, Sprout } from 'lucide-react';
import api from '../lib/api';
import HarvestReadinessCard from '../components/HarvestReadinessCard';

// Mini NDVI Sparkline Chart
function NDVIChart({ timeseries, currentWeek, peakWeek }) {
  if (!timeseries || timeseries.length === 0) return null;
  
  const width = 600;
  const height = 120;
  const padding = { top: 10, right: 15, bottom: 25, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  
  const maxNdvi = Math.max(...timeseries.map(d => d.ndvi), 0.9);
  const points = timeseries.map((d, i) => ({
    x: padding.left + (i / (timeseries.length - 1)) * chartW,
    y: padding.top + chartH - (d.ndvi / maxNdvi) * chartH,
    ndvi: d.ndvi,
    week: d.week,
    date: d.date
  }));
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length-1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;
  
  const currentPoint = points.find(p => p.week === currentWeek) || points[0];
  const peakPoint = points.find(p => p.week === peakWeek) || points[0];
  
  // Phase colors
  const getPhaseColor = (weekRatio) => {
    if (weekRatio < 0.15) return '#EAB308';
    if (weekRatio < 0.35) return '#22C55E';
    if (weekRatio < 0.55) return '#16A34A';
    if (weekRatio < 0.75) return '#15803D';
    if (weekRatio < 0.90) return '#F97316';
    return '#EF4444';
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: '140px' }}>
      <defs>
        <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1D9E75" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      
      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75].map(v => (
        <g key={v}>
          <line x1={padding.left} y1={padding.top + chartH - (v / maxNdvi) * chartH}
            x2={padding.left + chartW} y2={padding.top + chartH - (v / maxNdvi) * chartH}
            stroke="white" strokeOpacity="0.05" strokeDasharray="2 4" />
          <text x={padding.left - 5} y={padding.top + chartH - (v / maxNdvi) * chartH + 3}
            fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end" fontFamily="monospace">{v.toFixed(2)}</text>
        </g>
      ))}
      
      {/* Area fill */}
      <path d={areaD} fill="url(#ndviGrad)" />
      
      {/* Line */}
      <path d={pathD} fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" />
      
      {/* Phase color dots */}
      {points.filter((_, i) => i % 2 === 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5"
          fill={getPhaseColor(p.week / timeseries.length)}
          stroke="#0D1517" strokeWidth="1" />
      ))}
      
      {/* Peak marker */}
      <g>
        <line x1={peakPoint.x} y1={peakPoint.y - 8} x2={peakPoint.x} y2={padding.top + chartH}
          stroke="#1D9E75" strokeDasharray="3 3" strokeOpacity="0.4" />
        <circle cx={peakPoint.x} cy={peakPoint.y} r="5" fill="#1D9E75" stroke="#0D1517" strokeWidth="2" />
        <text x={peakPoint.x} y={peakPoint.y - 12} fill="#1D9E75" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">PEAK</text>
      </g>
      
      {/* Current position marker */}
      {currentWeek <= timeseries.length && (
        <g>
          <line x1={currentPoint.x} y1={padding.top} x2={currentPoint.x} y2={padding.top + chartH}
            stroke="#EF9F27" strokeDasharray="2 2" strokeOpacity="0.6" />
          <circle cx={currentPoint.x} cy={currentPoint.y} r="6" fill="none" stroke="#EF9F27" strokeWidth="2">
            <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={currentPoint.x} cy={currentPoint.y} r="3" fill="#EF9F27" />
          <text x={currentPoint.x} y={padding.top + chartH + 14} fill="#EF9F27" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">NOW</text>
        </g>
      )}
      
      {/* X-axis week labels */}
      {points.filter((_, i) => i % Math.max(1, Math.floor(timeseries.length / 6)) === 0).map((p) => (
        <text key={p.week} x={p.x} y={padding.top + chartH + 14}
          fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="middle" fontFamily="monospace">W{p.week}</text>
      ))}
    </svg>
  );
}

// Satellite Image Card
function SatelliteImageGrid({ images, dataSource }) {
  const [viewIdx, setViewIdx] = useState(null);
  if (!images || images.length === 0) return null;
  const isLive = dataSource && dataSource.includes('Live');
  
  return (
    <div className="bg-[#0D1517] border border-[#1D9E75]/20 rounded-2xl overflow-hidden">
      <div className="bg-[#1D9E75]/10 border-b border-[#1D9E75]/20 px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Satellite size={13} className="text-[#1D9E75]" />
          <span className="text-[9px] font-black text-[#1D9E75] uppercase tracking-[0.2em]">
            {isLive ? 'Live Satellite Imagery' : 'Sentinel-2 Imagery Timeline'}
          </span>
        </div>
        {isLive && (
          <span className="flex items-center gap-1.5 text-[8px] font-black text-emerald-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        )}
      </div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <div key={i} className="group relative">
            <div className="aspect-square bg-[#0A1214] rounded-xl border border-white/5 overflow-hidden relative cursor-pointer hover:border-[#1D9E75]/40 transition-all"
              onClick={() => setViewIdx(viewIdx === i ? null : i)}>
              <img 
                src={img.ndvi_url} 
                alt={`${img.phase} satellite`}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                  const fallback = document.createElement('div');
                  fallback.className = 'text-center';
                  fallback.innerHTML = `<div class="text-[#1D9E75] text-2xl mb-1">🛰️</div><div class="text-[8px] text-white/30 font-bold uppercase">W${img.week}</div>`;
                  e.target.parentElement.appendChild(fallback);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-[9px] font-black text-white uppercase">{img.phase}</p>
                <p className="text-[8px] text-white/50 font-mono">W{img.week} · {img.date}</p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye size={12} className="text-white/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {viewIdx !== null && (
        <div className="px-4 pb-4">
          <div className="bg-white/5 rounded-xl p-3 flex gap-3 items-start border border-white/10">
            <img src={images[viewIdx].true_color_url} alt="True color"
              className="w-24 h-24 rounded-lg object-cover border border-white/10"
              onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="flex-1 text-xs space-y-1">
              <p className="text-white font-bold">{images[viewIdx].phase}</p>
              <p className="text-white/50 font-mono text-[10px]">Observation Date: {images[viewIdx].date}</p>
              <p className="text-white/50 font-mono text-[10px]">Week: {images[viewIdx].week}</p>
              {images[viewIdx].ndvi_range && (
                <p className="text-[#1D9E75] font-mono text-[10px] font-bold">NDVI Range: {images[viewIdx].ndvi_range}</p>
              )}
              <p className="text-white/30 text-[9px]">Sentinel-2 L2A NDVI false-color composite</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Phase Legend Bar
function PhaseLegend({ weeklyNdvi, currentWeek }) {
  if (!weeklyNdvi || weeklyNdvi.length === 0) return null;
  const phases = [...new Map(weeklyNdvi.map(w => [w.phase, w])).values()];
  
  return (
    <div className="flex gap-2 flex-wrap">
      {phases.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5 text-[9px] font-bold text-white/50 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.phase_color }} />
          {p.phase}
        </span>
      ))}
    </div>
  );
}

function toOptimizedImageDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 800;
        const originalW = img.width;
        const originalH = img.height;
        const scale = Math.min(1, maxSide / Math.max(originalW, originalH));
        const targetW = Math.max(1, Math.round(originalW * scale));
        const targetH = Math.max(1, Math.round(originalH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result);
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);

        let quality = 0.7;
        let output = canvas.toDataURL('image/jpeg', quality);

        while (output.length > 800_000 && quality > 0.3) {
          quality -= 0.1;
          output = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(output);
      };

      img.onerror = () => resolve(reader.result);
      img.src = String(reader.result);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Grow() {
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [showSatelliteData, setShowSatelliteData] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [sendingSms, setSendingSms] = useState(false);
  const [weekPhotos, setWeekPhotos] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (timeline?.id) {
      const saved = localStorage.getItem(`fasal_photos_${timeline.id}`);
      if (saved) setWeekPhotos(JSON.parse(saved));
    }
  }, [timeline?.id]);

  const handlePhotoUpload = async (weekNum, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const base64 = await toOptimizedImageDataUrl(file);
      const newPhotos = { ...weekPhotos, [weekNum]: base64 };
      setWeekPhotos(newPhotos);
      if (timeline?.id) localStorage.setItem(`fasal_photos_${timeline.id}`, JSON.stringify(newPhotos));

      const res = await api.post(`/timeline/${timeline.id}/analyze`, {
        weekNum,
        imageBase64: base64
      });

      if (res.data.success) {
        const refreshed = await api.get('/timeline/active');
        setTimeline(refreshed.data);
        const nextWeek = Math.min(weekNum + 1, refreshed.data?.weeks?.length || weekNum + 1);
        setSelectedWeek(nextWeek);
      }
    } catch (err) {
      alert("Failed to analyze image with AI: " + (err.response?.data?.error || err.message));
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/timeline/active'),
      api.get('/profile')
    ]).then(([timelineRes, profileRes]) => {
      setTimeline(timelineRes.data);
      setProfile(profileRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const advance = async () => {
    setAdvancing(true);
    try {
      const res = await api.patch(`/timeline/${timeline.id}/advance`, { current_week: timeline.current_week + 1 });
      setTimeline(prev => ({ ...prev, ...res.data }));
    } catch (e) {
      alert('Failed to advance');
    }
    setAdvancing(false);
  };

  const testSmsPush = async () => {
    setSendingSms(true);
    try {
      await api.post('/sms/demo-push');
      alert('✅ Twilio SMS Push successfully dispatched to your verified number!');
    } catch (e) {
      alert('Failed to send SMS: ' + (e.response?.data?.error || e.message));
    }
    setSendingSms(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-text-secondary">Loading timeline...</div>;
  if (!timeline?.active) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Sprout className="text-border mb-4" size={48} />
      <h2 className="text-xl font-bold mb-2">No active crop</h2>
      <p className="text-text-secondary mb-4">Select a crop in Stage 1 to start your growing timeline</p>
      <button onClick={() => navigate('/dashboard/plan')} className="px-6 py-2.5 bg-green-primary text-white rounded-lg font-semibold">Go to Plan</button>
    </div>
  );

  const weeks = timeline.weeks || [];
  const current = timeline.current_week;
  const harvestWeek = timeline.harvest_window_week;
  const displayWeekNum = selectedWeek || current;
  const displayWeekData = weeks[displayWeekNum - 1] || weeks[current - 1];
  const ndvi = timeline.ndvi_analysis;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stage 2 — Growing: {timeline.crop}</h1>
          <p className="text-text-secondary text-sm">Planted: {timeline.planting_date}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={testSmsPush} disabled={sendingSms}
            className="flex items-center gap-2 glass-button px-3 py-1.5 rounded-lg text-xs font-bold text-amber hover:text-white border-amber/30 hover:border-amber transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] disabled:opacity-50">
            {sendingSms ? 'Sending...' : '📲 Demo SMS Push'}
          </button>
          <div className="text-sm text-text-secondary">
            {timeline.days_to_harvest > 0 ? `${timeline.days_to_harvest} days to harvest` : '🌾 Harvest ready!'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {weeks.map((w, i) => {
          const weekNum = i + 1;
          const isPast = weekNum < current;
          const isCurrent = weekNum === current;
          const isHarvest = weekNum === harvestWeek;
          const ndviWeek = ndvi?.weekly_ndvi?.find(n => n.week === weekNum);
          const isSelected = weekNum === displayWeekNum;
          return (
            <div key={i} className={`flex items-center gap-1 flex-shrink-0 cursor-pointer`} onClick={() => setSelectedWeek(weekNum)}>
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all backdrop-blur-md border ${
                isSelected ? 'bg-green-primary text-white border-green-primary shadow-[0_0_15px_rgba(29,158,117,0.4)] scale-105' :
                isPast ? 'bg-green-primary/20 text-green-primary border-green-primary/30 hover:bg-green-primary/30' :
                isCurrent ? 'bg-green-primary/40 text-white border-green-primary/50 ring-1 ring-green-primary/30' :
                'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10 hover:text-white'
              } ${isHarvest && !isSelected ? 'ring-2 ring-amber/50 border-amber/30' : ''}`}
                title={ndviWeek ? `${ndviWeek.phase} · NDVI: ${ndvi?.ndvi_timeseries?.[i]?.ndvi?.toFixed(2)}` : ''}>
                {isPast && !isSelected ? <Check size={12} className="inline" /> : null} W{weekNum}
              </div>
              {i < weeks.length - 1 && <div className={`w-4 h-0.5 ${isPast ? 'bg-green-primary' : 'bg-border'}`} />}
            </div>
          );
        })}
      </div>

      {/* Satellite Data Toggle */}
      {ndvi && (
        <button 
          onClick={() => setShowSatelliteData(!showSatelliteData)}
          className="w-full flex items-center justify-between p-4 glass-panel hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Satellite className="text-green-primary group-hover:scale-110 transition-transform" size={20} />
            <div className="text-left">
              <h3 className="text-sm font-bold text-white">Sentinel-2 Satellite Intelligence</h3>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">NDVI Analysis & Imagery</p>
            </div>
          </div>
          <div className="text-green-primary">
            {showSatelliteData ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>
      )}

      {/* Satellite Data Collapsible Content */}
      {showSatelliteData && ndvi && (
        <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-300">
          {/* NDVI Curve Section */}
          <div className="bg-bg-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-green-primary/10 border-b border-white/5 px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={13} className="text-green-primary" />
              <span className="text-[9px] font-black text-green-primary uppercase tracking-[0.2em]">NDVI Vegetation Index Curve</span>
            </div>
            <span className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-white/30 uppercase">{ndvi.data_source}</span>
              {ndvi.data_source?.includes('Live') && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[7px] font-black text-emerald-400 uppercase">Live Data</span>
                </span>
              )}
            </span>
          </div>
          <div className="p-4 space-y-3">
            <NDVIChart
              timeseries={ndvi.ndvi_timeseries}
              currentWeek={current}
              peakWeek={ndvi.peak?.week}
            />
            <div className="flex items-center justify-between">
              <PhaseLegend weeklyNdvi={ndvi.weekly_ndvi} currentWeek={current} />
              <div className="flex gap-4 text-[10px] font-mono text-white/40">
                <span>Peak: <span className="text-[#1D9E75] font-bold">{ndvi.peak?.ndvi?.toFixed(2)}</span> (W{ndvi.peak?.week})</span>
                <span>Now: <span className="text-[#EF9F27] font-bold">{ndvi.current_state?.ndvi?.toFixed(2)}</span></span>
                <span>Obs: <span className="text-white/60">{ndvi.observations_count}</span></span>
              </div>
            </div>
          </div>
        </div>

      {/* Satellite Images */}
      {ndvi?.satellite_images && (
        <SatelliteImageGrid images={ndvi.satellite_images} dataSource={ndvi.data_source} />
      )}

      {/* Harvest Readiness (Satellite Support) */}
      {timeline.status !== 'ready' && (
        <HarvestReadinessCard profile={profile} timeline={timeline} />
      )}
      </div>
      )}
      
      {/* Weather alert */}
      {timeline.weather_alert && (
        <div className="glass-panel border-l-4 border-l-amber rounded-xl p-4 flex items-start gap-3">
          <CloudRain className="text-amber flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-sm text-white">{timeline.weather_alert.message}</p>
            <p className="text-sm text-text-secondary">{timeline.weather_alert.action}</p>
          </div>
        </div>
      )}

      {/* Harvest ready banner */}
      {timeline.status === 'ready' && (
        <div className="bg-green-primary/20 border border-green-primary/40 backdrop-blur-md rounded-xl p-6 text-center shadow-[0_0_30px_rgba(29,158,117,0.15)]">
          <PartyPopper className="text-green-primary mx-auto mb-2 drop-shadow-[0_0_8px_rgba(29,158,117,0.8)]" size={32} />
          <h2 className="text-xl font-bold text-white drop-shadow-md">🌾 Harvest ready!</h2>
          <p className="text-text-secondary text-sm mb-4">{timeline.crop} is ready to harvest</p>
          <button onClick={() => navigate('/dashboard/sell')}
            className="glass-button px-6 py-2.5 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(29,158,117,0.3)]">
            Go to Sell Dashboard →
          </button>
        </div>
      )}
      {/* Selected week card */}
      {displayWeekData && timeline.status !== 'ready' && (
        <div className={`accent-card p-6 space-y-3 ${displayWeekNum === current ? 'green' : 'border-white/5 bg-white/5'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`${displayWeekNum === current ? 'bg-green-primary/20 text-green-primary border-green-primary/30' : 'bg-white/10 text-text-secondary border-white/20'} border text-xs font-bold px-3 py-1 rounded-full`}>
                Week {displayWeekNum} of {weeks.length} {displayWeekNum === current ? '(Current)' : ''}
              </span>
              {displayWeekData.ai_adjusted && (
                <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                  <Sprout size={10} /> AI Branch
                </span>
              )}
              {ndvi?.weekly_ndvi?.[displayWeekNum - 1] && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    backgroundColor: ndvi.weekly_ndvi[displayWeekNum - 1].phase_color + '20',
                    color: ndvi.weekly_ndvi[displayWeekNum - 1].phase_color,
                    border: `1px solid ${ndvi.weekly_ndvi[displayWeekNum - 1].phase_color}40`
                  }}>
                  {ndvi.weekly_ndvi[displayWeekNum - 1].phase} · NDVI {ndvi.ndvi_timeseries?.[displayWeekNum - 1]?.ndvi?.toFixed(2)}
                </span>
              )}
            </div>
            {displayWeekData.critical && <span className="bg-danger/20 text-danger border border-danger/30 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={10} /> CRITICAL</span>}
          </div>
          <h2 className="text-xl font-bold text-white">{displayWeekData.title}</h2>
          <p className="text-sm text-text-primary">{displayWeekData.task}</p>
          <p className="text-sm text-text-secondary">{displayWeekData.detail}</p>
          {displayWeekData.inputs_needed && (
            <span className="inline-block bg-amber/20 border border-amber/30 text-amber text-xs font-medium px-3 py-1 rounded-full">Inputs: {displayWeekData.inputs_needed}</span>
          )}

          {/* User Photo Upload Section */}
          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera size={16} className="text-green-primary" /> 
                Field Update Analysis
              </h3>
            </div>
            
            {weekPhotos[displayWeekNum] ? (
              <div className="space-y-4">
                <div className="relative group rounded-lg overflow-hidden border border-white/10">
                  <img src={weekPhotos[displayWeekNum]} alt={`Week ${displayWeekNum} field`} className="w-full h-48 object-cover opacity-80" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                      <Loader2 className="text-green-primary animate-spin mb-2" size={32} />
                      <p className="text-white font-bold animate-pulse text-sm">Gemini Vision Scanning...</p>
                      <p className="text-text-secondary text-[10px] mt-1">Branching node timeline...</p>
                    </div>
                  )}
                  {!isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-white/20">
                        Replace Photo
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(displayWeekNum, e)} />
                      </label>
                    </div>
                  )}
                </div>
                {displayWeekData.analysis_summary && (
                  <div className="bg-purple-900/30 border border-purple-500/30 p-3 rounded-lg flex items-start gap-3 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <Sprout className="text-purple-400 mt-0.5 flex-shrink-0" size={16} />
                    <div className="text-xs">
                      <span className="font-bold text-purple-300 block mb-1">AI Branch Generated</span>
                      <span className="text-purple-100/70 leading-relaxed">{displayWeekData.analysis_summary}</span>
                      {displayWeekData.ai_branch?.immediate_actions?.length > 0 && (
                        <span className="text-purple-100/70 leading-relaxed block mt-2">
                          Next actions: {displayWeekData.ai_branch.immediate_actions.join(' | ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 hover:border-green-primary/50 rounded-lg cursor-pointer bg-black/20 hover:bg-white/5 transition-all group">
                <Camera className="text-text-secondary group-hover:text-green-primary mb-2 transition-colors" size={24} />
                <span className="text-sm font-semibold text-text-secondary group-hover:text-white transition-colors">Upload photo for Week {displayWeekNum}</span>
                <span className="text-[10px] text-text-secondary/50 mt-1">Gemini Vision will dynamically adjust remaining weeks</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(displayWeekNum, e)} />
              </label>
            )}
          </div>

          {displayWeekNum === current && (
            <button onClick={advance} disabled={advancing}
              className="mt-2 w-full glass-button px-6 py-2.5 text-sm font-semibold rounded-lg disabled:opacity-50">
              {advancing ? 'Advancing...' : 'Mark this week complete ✓'}
            </button>
          )}
        </div>
      )}

      {/* All weeks timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {weeks.map((w, i) => {
          const weekNum = i + 1;
          const isPast = weekNum < current;
          const isCurrent = weekNum === current;
          const isSelected = weekNum === displayWeekNum;
          const ndviWeek = ndvi?.weekly_ndvi?.[i];
          const ndviObs = ndvi?.ndvi_timeseries?.[i];
          // Calculate the date for this week based on planting date
          const weekDate = timeline.planting_date ? (() => {
            const d = new Date(timeline.planting_date);
            d.setDate(d.getDate() + i * 7);
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          })() : null;
          return (
            <div key={i} onClick={() => setSelectedWeek(weekNum)} className={`p-4 rounded-xl border text-sm cursor-pointer transition-all ${
              isSelected ? 'border-green-primary bg-green-primary/10 shadow-[0_0_15px_rgba(29,158,117,0.15)] scale-[1.02]' :
              isCurrent ? 'border-green-primary/50 bg-white/5 hover:bg-white/10' :
              isPast ? 'border-white/5 bg-white/5 opacity-60 hover:opacity-100' : 'border-white/10 hover:border-white/20 bg-black/20 hover:bg-white/5'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Week {weekNum}</span>
                  {ndviWeek && (
                    <span className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: ndviWeek.phase_color, color: ndviWeek.phase_color }} title={ndviWeek.phase} />
                  )}
                  {ndviWeek && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border" style={{
                      backgroundColor: ndviWeek.phase_color + '15',
                      borderColor: ndviWeek.phase_color + '40',
                      color: ndviWeek.phase_color
                    }}>{ndviWeek.phase}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {weekDate && (
                    <span className="text-[10px] font-medium text-text-secondary bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                      📅 {weekDate}
                    </span>
                  )}
                  {ndviObs && (
                    <span className="text-[9px] font-mono text-text-secondary" title="Expected NDVI">
                      NDVI {ndviObs.ndvi.toFixed(2)}
                    </span>
                  )}
                  {isPast && <Check size={14} className="text-green-primary drop-shadow-[0_0_5px_rgba(29,158,117,0.8)]" />}
                </div>
              </div>
              <p className="text-text-secondary text-xs">{w.title}</p>
              {w.task && <p className="text-text-secondary text-[10px] mt-0.5 line-clamp-1">{w.task}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
