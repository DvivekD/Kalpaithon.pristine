import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Sprout, Sun, TrendingUp, Clock, User, MessageCircle, LogOut, Cloud, Thermometer, Droplets, Radio } from 'lucide-react';
import api from '../lib/api';
import LowPolyFarm from '../components/LowPolyFarm';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [weather, setWeather] = useState(null);
  const [nextSeason, setNextSeason] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [iot, setIot] = useState(null);

  useEffect(() => {
    api.get('/profile').then(r => setProfile(r.data)).catch(() => {});
    api.get('/weather/current').then(r => setWeather(r.data)).catch(() => {});
    api.get('/predict/next-season').then(r => setNextSeason(r.data)).catch(() => {});
    
    const fetchTimeline = () => api.get('/timeline/active').then(r => setTimeline(r.data)).catch(() => {});
    fetchTimeline();
    
    api.get('/iot/latest?device_id=fasal-node-001').then(r => setIot(r.data)).catch(() => {});

    window.addEventListener('fasal-timeline-updated', fetchTimeline);
    return () => window.removeEventListener('fasal-timeline-updated', fetchTimeline);
  }, []);

  const nav = [
    { path: '/dashboard/plan', label: 'Plan', icon: <Sun size={18} />, stage: 1 },
    { path: '/dashboard/grow', label: 'Grow', icon: <Sprout size={18} />, stage: 2 },
    { path: '/dashboard/sell', label: 'Sell', icon: <TrendingUp size={18} />, stage: 3 },
    { divider: true },
    { path: '/dashboard/history', label: 'History', icon: <Clock size={18} /> },
    { path: '/dashboard/iot', label: 'IoT Monitor', icon: <Radio size={18} /> },
    { path: '/dashboard/profile', label: 'Profile', icon: <User size={18} /> },
  ];

  const isActive = (path) => location.pathname === path || (path === '/dashboard/plan' && location.pathname === '/dashboard');

  return (
    <div className="min-h-screen flex bg-transparent text-text-primary overflow-hidden relative z-10 field-grid">
      <aside className="w-[280px] xl:w-[320px] bg-transparent backdrop-blur-sm border-r border-white/5 hidden md:flex flex-col min-h-screen sticky top-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded bg-transparent border border-white/10 flex items-center justify-center">
              <Sprout className="text-white" size={16} />
            </div>
            <span className="hero-display text-2xl text-white tracking-wide">Fasal</span>
          </div>
          {profile && (
            <div className="mt-8">
              <p className="font-sans text-[10px] tracking-widest uppercase text-text-secondary opacity-60 mb-2">Active Profile</p>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-white text-sm">{profile.name}</p>
                <span className="text-[10px] text-green-primary uppercase tracking-widest opacity-80">{profile.farmer_id}</span>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-8 flex flex-col gap-2">
          {nav.map((item, i) => item.divider ? (
            <div key={i} className="my-4 mx-6 border-t border-white/5" />
          ) : (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-4 px-6 py-3 transition-all ${isActive(item.path) ? 'text-white border-l-2 border-green-primary bg-gradient-to-r from-green-primary/10 to-transparent' : 'text-text-secondary hover:text-white border-l-2 border-transparent hover:border-white/20'}`}>
              <div className="opacity-80">{item.icon}</div>
              <span className="uppercase tracking-widest text-[11px] font-semibold">{item.label}</span>
            </Link>
          ))}
          <a href="https://t.me/Kisaan1207bot" target="_blank" rel="noreferrer"
            className="flex items-center gap-4 px-6 py-3 text-text-secondary hover:text-white border-l-2 border-transparent hover:border-white/20 transition-all mt-auto">
            <div className="opacity-80"><MessageCircle size={18} /></div>
            <span className="uppercase tracking-widest text-[11px] font-semibold">Telegram Bot</span>
          </a>
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={() => { localStorage.clear(); navigate('/'); }}
            className="flex items-center gap-2 text-xs text-text-secondary hover:text-coral transition">
            <LogOut size={14} /> Sign out
          </button>
          <p className="text-[10px] text-text-secondary/50 mt-2">Powered by Groq + Open-Meteo</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col relative z-0 h-screen">
        <header className="h-24 border-b border-white/5 bg-transparent backdrop-blur-md px-8 md:px-12 flex items-center justify-between sticky top-0 z-10 pt-safe-top">
          <div className="flex items-center gap-8">
            <div className="md:hidden flex items-center gap-2">
              <Sprout className="text-white" size={20} />
            </div>
            {profile?.current_season && (
              <div className="flex items-center gap-2 border border-white/10 px-3 py-1.5 rounded-sm bg-black/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-pulse"></span>
                <span className="text-[10px] uppercase tracking-widest text-green-primary font-bold">{profile.current_season}</span>
              </div>
            )}
            {profile && <span className="text-[10px] md:text-xs text-text-secondary uppercase tracking-wider truncate max-w-[120px] md:max-w-none">{profile.district}</span>}
          </div>
          {weather?.current && (
            <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest text-text-secondary border border-white/5 px-4 py-2 rounded-sm bg-black/20">
              <span className="flex items-center gap-2 text-white"><Thermometer size={14} className="text-text-secondary" /> {weather.current.temp}°C</span>
              <span className="w-px h-3 bg-white/10"></span>
              <span className="flex items-center gap-2"><Droplets size={14} /> {weather.current.humidity}%</span>
              <span className="w-px h-3 bg-white/10 hidden md:block"></span>
              <span className="hidden md:flex items-center gap-2"><Cloud size={14} /> {weather.summary.rainfall_7d}mm Forecast</span>
            </div>
          )}
        </header>

        {/* Content + Next Season Card */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 p-6 md:p-10 lg:p-14 overflow-y-auto pb-24 md:pb-12 relative">
            {/* 3D Digital Twin (Mobile/Tablet/Small Desktop View) */}
            <div className="block lg:hidden mb-6">
              <LowPolyFarm 
                soilMoisture={iot?.soil_moisture ?? 50} 
                cropProgress={timeline?.current_week && timeline?.weeks?.length ? timeline.current_week / timeline.weeks.length : 0} 
                isRaining={weather?.current?.condition?.toLowerCase().includes('rain') || false} 
              />
            </div>
            
            <div key={location.pathname} className="page-transition h-full">
              <Outlet />
            </div>
          </main>

          <aside className="w-[400px] 2xl:w-[480px] border-l border-white/5 bg-transparent backdrop-blur-sm p-8 2xl:p-10 hidden lg:block overflow-y-auto">
            <div className="space-y-12">
              {/* 3D Digital Twin */}
              <div className="mb-6">
                <LowPolyFarm 
                  soilMoisture={iot?.soil_moisture ?? 50} 
                  cropProgress={timeline?.current_week && timeline?.weeks?.length ? timeline.current_week / timeline.weeks.length : 0} 
                  isRaining={weather?.current?.condition?.toLowerCase().includes('rain') || false} 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sprout size={16} /> Next Season Forecast
                </h3>
                {nextSeason?.available === false || nextSeason?.no_history ? (
                  <div className="glass-panel rounded-xl p-4 text-sm text-text-secondary">
                    Complete your first season to unlock personalized recommendations.
                  </div>
                ) : nextSeason?.suggested_crop ? (
              <div className="space-y-3 surface-card p-5 rounded-xl">
                <div className="text-lg font-bold text-white">{nextSeason.suggested_crop}</div>
                <span className={`inline-block text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${nextSeason.confidence === 'high' ? 'bg-green-primary/20 text-green-primary border-green-primary/30' : 'bg-amber/20 text-amber border-amber/30'}`}>
                  {nextSeason.confidence} confidence
                </span>
                <div className={`text-sm font-semibold px-3 py-1.5 rounded border ${nextSeason.rotation_health === 'good' ? 'bg-green-primary/10 text-green-primary border-green-primary/20' : 'bg-amber/10 text-amber border-amber/20'}`}>
                  Rotation: {nextSeason.rotation_health}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{nextSeason.reason}</p>
              </div>
            ) : (
              <div className="glass-panel rounded-xl p-4 text-sm text-text-secondary animate-pulse border border-white/5">Loading...</div>
            )}
            </div>

              <div>
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2 mt-8">
                  <Sun size={16} /> Active Subsidies
                </h3>
                <div className="space-y-3">
                  <div className="surface-card p-4 rounded-xl border-l-2 border-l-amber relative overflow-hidden group cursor-pointer hover:bg-white/5 transition-all">
                    <div className="absolute top-0 right-0 bg-amber/20 text-amber text-[10px] font-bold px-2 py-1 rounded-bl-lg">₹5000/ha</div>
                    <h4 className="text-base font-bold text-white mb-1 pr-12">PM-KISAN</h4>
                    <p className="text-[11px] text-text-secondary leading-relaxed">Next installment expected in 14 days. Ensure KYC is updated.</p>
                  </div>

                  <div className="surface-card p-4 rounded-xl border-l-2 border-l-green-primary relative overflow-hidden group cursor-pointer hover:bg-white/5 transition-all">
                    <div className="absolute top-0 right-0 bg-green-primary/20 text-green-primary text-[10px] font-bold px-2 py-1 rounded-bl-lg">80% Off</div>
                    <h4 className="text-base font-bold text-white mb-1 pr-12">SMAM Scheme</h4>
                    <p className="text-[11px] text-text-secondary leading-relaxed">Subsidies available for purchasing tractors and farm machinery.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2 mt-8">
                  <TrendingUp size={16} /> Market Insight
                </h3>
              <div className="surface-card p-5 rounded-xl bg-gradient-to-br from-green-primary/12 to-transparent">
                <div className="flex items-end justify-between mb-3">
                  <span className="text-3xl font-black text-white">▲ 12%</span>
                  <span className="text-[11px] text-green-primary font-bold uppercase">Demand Surge</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Export demands for Maize are currently peaking. Consider holding inventory for 2 more weeks if storage permits.
                </p>
              </div>
            </div>
          </div>
          </aside>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 w-full glass-panel border-t border-white/10 z-50 pb-safe-bottom">
        <nav className="flex justify-around items-center p-2">
          {nav.filter(item => !item.divider).map((item, i) => (
            <Link key={i} to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive(item.path) ? 'text-green-primary drop-shadow-[0_0_8px_rgba(29,158,117,0.8)]' : 'text-text-secondary hover:text-text-primary'}`}>
              {item.icon}
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
