import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Info, TrendingUp, Calendar, Satellite } from 'lucide-react';
import api from '../lib/api';

export default function HarvestReadinessCard({ profile, timeline }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    if (profile && timeline) {
      api.get('/grow/readiness')
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Readiness fetch error:', err);
          setLoading(false);
        });
    }
  }, [profile, timeline]);

  if (loading) {
    return (
      <div className="bg-[#0D1517] border border-[#1D9E75]/20 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="animate-spin text-[#1D9E75] mb-4" size={32} />
        <p className="text-[#1D9E75]/60 text-xs font-black uppercase tracking-widest">Satellite Sync Active...</p>
      </div>
    );
  }

  if (!data) return null;

  const isHighConfidence = data.confidence === 'HIGH';
  const isFallback = data.fallback_used;

  return (
    <div className="bg-[#0D1517] border border-[#1D9E75]/30 rounded-2xl overflow-hidden shadow-2xl">
      {/* Terminal-style Header */}
      <div className="bg-[#1D9E75]/10 border-b border-[#1D9E75]/20 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Satellite size={14} className="text-[#1D9E75]" />
          <span className="text-[10px] font-black text-[#1D9E75] uppercase tracking-[0.2em]">Sentinel-2 Maturity Link</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
          isHighConfidence ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'
        }`}>
          {data.confidence} CONFIDENCE
        </div>
      </div>

      <div className="p-6 flex flex-col md:flex-row gap-8 items-center">
        {/* Gauge Section */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1D9E75" strokeWidth="2" strokeDasharray="2 4" className="opacity-10" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1D9E75" strokeWidth="8" strokeDasharray={`${data.readiness_score * 2.8} 283`} strokeLinecap="round" className="transition-all duration-1000 ease-out" transform="rotate(-90 50 50)" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white leading-none">{data.readiness_score}%</span>
            <span className="text-[9px] font-black text-[#1D9E75] uppercase mt-1">Ready</span>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              data.status === 'READY' ? 'bg-green-500 text-white' : 'bg-[#1D9E75]/20 text-[#1D9E75]'
            }`}>
              {data.status}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white/60 uppercase">
              <Calendar size={12} />
              Window: {data.window_estimate_days[0]}-{data.window_estimate_days[1]} Days
            </div>
          </div>

          <p className="text-sm text-white/80 leading-relaxed font-medium">
            {data.explanation}
          </p>

          {isFallback && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
              <p className="text-[10px] text-amber-500/80 font-bold leading-tight">
                {data.reliability_note}
              </p>
            </div>
          )}
        </div>

        {/* Trend Section */}
        <div className="w-full md:w-auto md:min-w-[180px] p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-[9px] font-black text-[#1D9E75] uppercase tracking-widest">
            <span>NDVI Analysis</span>
            <TrendingUp size={12} />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-white/40 font-bold">Trend</span>
              <span className="text-white font-black">{data.trend}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-white/40 font-bold">Peak Index</span>
              <span className="text-white font-black">{data.peak_ndvi?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-white/40 font-bold">Current</span>
              <span className="text-white font-black">{data.current_ndvi?.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowWhy(!showWhy)}
            className="w-full mt-2 py-1.5 border border-[#1D9E75]/30 rounded text-[9px] font-black text-[#1D9E75] uppercase hover:bg-[#1D9E75]/10 transition-all flex items-center justify-center gap-1.5"
          >
            <Info size={10} />
            {showWhy ? 'Hide Analysis' : 'Why this estimate?'}
          </button>
        </div>
      </div>

      {showWhy && (
        <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-white/[0.02]">
          <div className="text-[10px] text-white/50 leading-relaxed font-medium space-y-2">
            <p className="text-[#1D9E75] font-black uppercase tracking-widest mb-2">Technical Breakdown:</p>
            <p>• Observations processed: <span className="text-white">{data.observations_used}</span> Sentinel-2 frames.</p>
            <p>• Maturity indicator: {data.days_since_peak > 0 ? `Detected senescence starting ${data.days_since_peak} days post-peak.` : 'Crop is still in physiological growth phase.'}</p>
            <p>• Logic: Combined NDVI time-series curve fitting with sowing age ({data.days_since_sowing || 'N/A'} days) and heat accumulation.</p>
          </div>
        </div>
      )}
    </div>
  );
}
