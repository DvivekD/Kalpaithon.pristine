import { useState, useEffect } from 'react';
import { Calculator, AlertCircle, CheckCircle2, IndianRupee, TrendingUp, Wallet, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function T35Challenge() {
  const [seeds, setSeeds] = useState(0);
  const [water, setWater] = useState(0);
  const [fertilizer, setFertilizer] = useState(0);
  const [labor, setLabor] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [margin, setMargin] = useState(0);
  const [isAutoGrabbing, setIsAutoGrabbing] = useState(false);
  const [syncScore, setSyncScore] = useState(null);

  // Auto-sync or Auto-grab suggested total price on load
  useEffect(() => {
    const savedData = localStorage.getItem('t35_sync');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setSeeds(parsed.seeds || 0);
      setWater(parsed.water || 0);
      setFertilizer(parsed.fertilizer || 0);
      setLabor(parsed.labor || 0);
      setSellingPrice(parsed.sellingPrice || 0);
      setSyncScore(parsed.score || null);
      // Don't auto-grab if we have synced data
      return;
    }

    const fetchPrice = async () => {
      setIsAutoGrabbing(true);
      try {
        const res = await api.post('/sell', { quantity_kg: 1000 });
        if (res.data.gross_revenue) {
          setSellingPrice(res.data.gross_revenue);
        }
      } catch (e) {
        console.error("Auto-grab failed", e);
      }
      setIsAutoGrabbing(false);
    };
    fetchPrice();
  }, []);

  useEffect(() => {
    const cost = Number(seeds) + Number(water) + Number(fertilizer) + Number(labor);
    setTotalCost(cost);
    
    if (sellingPrice > 0) {
      // Step 3: Profit margin = (suggested_selling_price - total_cost) / suggested_selling_price * 100
      const m = ((sellingPrice - cost) / sellingPrice) * 100;
      setMargin(m);
    } else {
      setMargin(0);
    }
  }, [seeds, water, fertilizer, labor, sellingPrice]);

  return (
    <div className="min-h-screen bg-[#F8FAFB] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/dashboard/sell" className="flex items-center gap-2 text-[#5A7068] hover:text-[#1D9E75] transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-semibold">Back to Market</span>
          </Link>
          <div className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded tracking-widest uppercase">Task T35</div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-[#1E2D2F] tracking-tight">Farmer Crop to Market</h1>
          <p className="text-[#5A7068]">Official Kalpaithon 2.0 Activity: Profit Margin Estimator</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Step 1: Input Form */}
          <div className="bg-white rounded-3xl shadow-xl border border-[#E2EAE7] p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#1D9E75]/10 rounded-xl flex items-center justify-center">
                <Wallet className="text-[#1D9E75]" size={20} />
              </div>
              <h2 className="text-lg font-bold text-[#1E2D2F]">Cost Breakdown (Total)</h2>
            </div>

            <div className="space-y-4">
              <CostInput label="Seed Cost" value={seeds} onChange={setSeeds} color="#1D9E75" />
              <CostInput label="Water Cost" value={water} onChange={setWater} color="#3B82F6" />
              <CostInput label="Fertilizer Cost" value={fertilizer} onChange={setFertilizer} color="#EF9F27" />
              <CostInput label="Labor Cost" value={labor} onChange={setLabor} color="#8B5CF6" />
            </div>

            <div className="pt-4 border-t border-[#E2EAE7]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#1E2D2F]/5 rounded-xl flex items-center justify-center">
                  <IndianRupee className="text-[#1E2D2F]" size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-[#1E2D2F]">Market Price</h2>
                  {isAutoGrabbing && <p className="text-[10px] text-green-primary animate-pulse font-bold">AUTO-GRABBING LIVE PRICE...</p>}
                </div>
              </div>
              <CostInput label="Total Selling Price" value={sellingPrice} onChange={setSellingPrice} color="#1E2D2F" placeholder="Expected revenue" />
            </div>
          </div>

          {/* Results Analysis */}
          <div className="space-y-6">
            
            {/* Step 2: Total Cost */}
            <div className="bg-[#1E2D2F] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Total Input Cost</p>
              <h3 className="text-4xl font-black italic">₹{totalCost.toLocaleString()}</h3>
            </div>

            {/* Step 3 & 4: Margin Display */}
            <div className="bg-white rounded-3xl shadow-xl border border-[#E2EAE7] p-8 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                 <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="#E2EAE7" strokeWidth="12" fill="transparent" />
                    <circle cx="64" cy="64" r="58" stroke={margin >= 10 ? '#1D9E75' : '#E8593C'} strokeWidth="12" fill="transparent" 
                      strokeDasharray={364.4} strokeDashoffset={364.4 - (Math.min(Math.max(margin, 0), 100) / 100) * 364.4}
                      strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-2xl font-black text-[#1E2D2F]">{Math.round(margin)}%</span>
                   <span className="text-[10px] font-bold text-[#5A7068] uppercase">Margin</span>
                 </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-bold text-[#1E2D2F]">Profit Margin Analysis</h4>
                <p className="text-sm text-[#5A7068]">Calculation based on total investment vs market value.</p>
              </div>
            </div>

            {/* Step 5 & 6: Conditional Messages */}
            {sellingPrice > 0 && (
              <div className={`rounded-3xl p-6 border-2 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${margin < 10 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${margin < 10 ? 'bg-red-500/10 text-red-500' : 'bg-[#1D9E75]/10 text-[#1D9E75]'}`}>
                  {margin < 10 ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <div>
                  {margin < 10 ? (
                    <>
                      <h4 className="font-bold text-red-800">Low Profit Margin ({Math.round(margin)}%)</h4>
                      <p className="text-sm text-red-700/80 mt-0.5">Consider waiting for better prices or storing your crop to improve returns.</p>
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold text-green-800">Good margin.</h4>
                      <p className="text-sm text-green-700/80 mt-0.5">Recommended to sell now based on current market rates and your low input costs.</p>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer Info */}
        <div className="bg-[#1D9E75]/5 rounded-2xl p-6 border border-[#1D9E75]/10">
          <h5 className="text-xs font-black text-[#1D9E75] uppercase tracking-widest mb-3">Activity Rules Check</h5>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
             <RuleItem label="Cost Breakdown Form" active={seeds || water || fertilizer || labor} />
             <RuleItem label="Sum of Inputs Calculated" active={totalCost > 0} />
             <RuleItem label="Profit Margin Algorithm" active={margin !== 0} />
             <RuleItem label="10% Threshold Warning" active={sellingPrice > 0} />
          </ul>
        </div>

      </div>
    </div>
  );
}

function CostInput({ label, value, onChange, color, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black text-[#5A7068] uppercase tracking-wider ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#1E2D2F]/30 text-sm">₹</div>
        <input 
          type="number" 
          value={value || ''} 
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={placeholder || "0"}
          className="w-full pl-8 pr-4 py-3.5 bg-[#F8FAFB] border border-[#E2EAE7] rounded-2xl focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none font-bold text-[#1E2D2F] transition-all"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

function RuleItem({ label, active }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${active ? 'bg-[#1D9E75] text-white' : 'bg-[#E2EAE7] text-[#5A7068]'}`}>
        <CheckCircle2 size={10} />
      </div>
      <span className={active ? 'text-[#1E2D2F] font-semibold' : 'text-[#5A7068]'}>{label}</span>
    </li>
  );
}
