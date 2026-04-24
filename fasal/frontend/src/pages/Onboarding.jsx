import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Droplets, Ruler, ChevronRight, Loader2, Info, AlertCircle, Satellite, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

const DISTRICTS = ["Kolar","Chikkaballapur","Bengaluru Rural","Bengaluru Urban","Ramanagara","Tumkur","Mysuru","Chamarajanagar","Mandya","Hassan","Dharwad","Belagavi","Haveri","Gadag","Vijayapura","Bagalkot","Raichur","Koppal","Ballari","Kalaburagi","Bidar","Yadgir","Davangere","Chitradurga","Shivamogga","Chikkamagaluru","Kodagu","Udupi","Dakshina Kannada","Uttara Kannada"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [district, setDistrict] = useState('');
  const [waterSource, setWaterSource] = useState('Rainfed');
  const [farmSize, setFarmSize] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isTriangulating, setIsTriangulating] = useState(false);
  const [triangulatedCoords, setTriangulatedCoords] = useState({ lat: 0, lon: 0 });
  const [locationName, setLocationName] = useState('');

  const detectLocation = async () => {
    setError(null);
    setLoading(true);
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setTriangulatedCoords({ lat: latitude, lon: longitude });
        setIsTriangulating(true);

        try {
          const res = await api.post('/profile/setup', {
            latitude,
            longitude,
            water_source: 'Rainfed', 
            farm_size: 1
          });
          console.log("Profile Setup Response:", res.data);
          setLocationData(res.data);
          setDistrict(res.data.profile.district);
          setLocationName(res.data.profile.display_name || '');
          console.log("Applied to State -> District:", res.data.profile.district, "Name:", res.data.profile.display_name);
          setSelectedLocation({ lat: latitude, lon: longitude });
          
          // Let the user see the locked coordinates and address in the radar before transitioning
          setTimeout(() => {
            setIsTriangulating(false);
            setStep(2);
            setLoading(false);
          }, 2500); // Wait 2.5 seconds after data is fetched
          
        } catch (e) {
          console.error("Detect location failed:", e);
          setError("Analysis failed. Please search your location manually.");
          setIsTriangulating(false);
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        console.error("Geolocation error:", err);
        setError("Could not get precise location. Please search manually.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const triggerSearch = async (queryOverride) => {
    const query = queryOverride || searchQuery;
    if (query.length < 3) return;
    
    setIsSearching(true);
    try {
      const res = await api.post('/profile/search-location', { query });
      setSearchResults(res.data.results || []);
    } catch (err) {
      console.error(err);
      setError("Search failed. Try a more specific location.");
    }
    setIsSearching(false);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      triggerSearch();
    }
  };

  const handleSelectLocation = async (loc) => {
    setSearchQuery(loc.display_name);
    setSearchResults([]);
    setDistrict(loc.district);
    setSelectedLocation({ lat: loc.lat, lon: loc.lon });
    
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/profile/setup', {
        latitude: loc.lat,
        longitude: loc.lon,
        water_source: waterSource,
        farm_size: 1
      });
      setLocationData(res.data);
      setStep(2);
    } catch (e) {
      console.error("Select location failed:", e);
      setStep(2); // Proceed to manual details anyway
    }
    setLoading(false);
  };

  const completeSetup = async () => {
    setLoading(true);
    try {
      await api.post('/profile/setup', {
        latitude: selectedLocation?.lat,
        longitude: selectedLocation?.lon,
        district_manual: district,
        water_source: waterSource,
        farm_size: parseFloat(farmSize) || 1,
        misc_notes: notes
      });
      navigate('/dashboard');
    } catch (e) {
      alert('Setup failed: ' + (e.response?.data?.error || e.message));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4 sm:p-8">
      <AnimatePresence>
        {isTriangulating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1E2D2F]/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="w-full max-w-md bg-[#0D1517] border border-[#1D9E75]/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(29,158,117,0.2)]">
              {/* Radar Grid */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1D9E75 1px, transparent 0)', backgroundSize: '30px 30px' }} />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-8">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-32 h-32 border border-[#1D9E75]/30 rounded-full flex items-center justify-center"
                  >
                    <div className="absolute inset-0 bg-gradient-conic from-[#1D9E75]/20 to-transparent rounded-full" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
                  </motion.div>
                  
                  {/* Ping Circles */}
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 2, delay: i * 0.6, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 border border-[#1D9E75] rounded-full"
                    />
                  ))}
                </div>

                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Satellite className="text-[#1D9E75] animate-bounce" size={20} />
                    <h3 className="text-[#1D9E75] text-xs font-black uppercase tracking-[0.3em]">Satellite Triangulation</h3>
                  </div>
                  
                  <div className="bg-black/40 rounded-xl p-4 border border-[#1D9E75]/20 font-mono">
                    <div className="flex justify-between text-[10px] text-[#1D9E75]/60 mb-2">
                      <span>RADAR_SCAN</span>
                      <span>RADIUS: 30KM</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white text-sm">LAT: <span className="text-[#1D9E75]">{triangulatedCoords.lat.toFixed(6)}</span></p>
                      <p className="text-white text-sm">LON: <span className="text-[#1D9E75]">{triangulatedCoords.lon.toFixed(6)}</span></p>
                      {locationName && (
                        <p className="text-[#1D9E75] text-[9px] mt-2 border-t border-[#1D9E75]/10 pt-1 uppercase tracking-tighter truncate">
                          ADDR: {locationName}
                        </p>
                      )}
                    </div>
                  </div>

                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-[#5A7068] text-[9px] font-bold uppercase tracking-widest"
                  >
                    Locking high-precision signal...
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-lg relative z-10">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-[#1D9E75]' : 'bg-[#E2EAE7]'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-[#E2EAE7] p-6 sm:p-10 transition-all">
          {step === 1 && (
            <div className="space-y-6">
              <div className="w-14 h-14 bg-[#1D9E75]/10 rounded-2xl flex items-center justify-center mb-2">
                <MapPin className="text-[#1D9E75]" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1E2D2F]">Where's your farm?</h2>
                <p className="text-[#5A7068] mt-1">We need this to analyse your soil and local weather.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button onClick={detectLocation} disabled={loading}
                className="w-full py-4 bg-[#1D9E75] text-white font-semibold rounded-xl hover:bg-[#0F6E56] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/10 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={22} /> : <MapPin size={22} />}
                {loading ? "Detecting location..." : "Use my current location"}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[#E2EAE7]"></div>
                <span className="flex-shrink mx-4 text-[#5A7068] text-xs font-medium uppercase tracking-wider">or select manually</span>
                <div className="flex-grow border-t border-[#E2EAE7]"></div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-[#1E2D2F] uppercase ml-1">Search Location</label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyPress}
                      disabled={loading}
                      placeholder="e.g. Tiptur, Tumakuru..."
                      className="w-full px-4 py-3.5 border border-[#E2EAE7] rounded-xl focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                    />
                    {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#5A7068]" size={18} />}
                  </div>
                  <button 
                    onClick={() => triggerSearch()}
                    disabled={loading || isSearching}
                    className="px-4 bg-white border border-[#E2EAE7] text-[#1D9E75] font-bold rounded-xl hover:bg-[#F0F7F4] transition-all flex items-center justify-center"
                  >
                    Go
                  </button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#E2EAE7] rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((loc, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full text-left px-4 py-3 hover:bg-[#F0F7F4] border-b border-[#E2EAE7] last:border-0 transition-colors"
                      >
                        <p className="font-semibold text-sm text-[#1E2D2F]">
                          {loc.display_name.split(',')[0]} {/* Show specific place name */}
                        </p>
                        <p className="text-[11px] text-[#5A7068] truncate">
                          {loc.district} district · {loc.display_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="w-14 h-14 bg-[#EF9F27]/10 rounded-2xl flex items-center justify-center mb-2">
                <Droplets className="text-[#EF9F27]" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-[#1E2D2F]">Farm Details</h2>

              <div className="bg-[#F0F7F4] border border-[#1D9E75]/20 rounded-xl p-4 flex gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-[#1D9E75]/10 flex-shrink-0">
                  <Info className="text-[#1D9E75]" size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1E2D2F]">Location & Soil</p>
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#5A7068]">District:</span>
                      <select 
                        value={district} 
                        onChange={(e) => setDistrict(e.target.value)}
                        className="text-xs font-bold text-[#1D9E75] bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                      >
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <p className="text-[10px] text-[#5A7068]">
                      Soil: <span className="font-semibold">{locationData?.profile?.soil_type || 'Red Loamy'}</span> (Based on district)
                    </p>
                    {locationName && (
                      <p className="text-[9px] text-[#1D9E75] font-bold mt-1 uppercase italic">
                        📍 {locationName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-[#1E2D2F]">Primary Water Source</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Rainfed', 'Borewell', 'Canal'].map(ws => (
                    <button key={ws} type="button" onClick={() => setWaterSource(ws)}
                      className={`py-3.5 rounded-xl border-2 text-sm font-bold transition-all ${waterSource === ws ? 'border-[#1D9E75] bg-[#F0F7F4] text-[#1D9E75]' : 'border-[#E2EAE7] text-[#5A7068] hover:border-[#1D9E75]/30'}`}>
                      {ws}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1E2D2F]">Farm Size (Acres)</label>
                <div className="relative">
                  <input type="number" step="0.1" value={farmSize} onChange={e => setFarmSize(e.target.value)}
                    className="w-full px-4 py-3.5 border border-[#E2EAE7] rounded-xl focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none" placeholder="e.g. 2.5" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5A7068] uppercase">Acres</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1E2D2F]">Field Notes (Optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full px-4 py-3.5 border border-[#E2EAE7] rounded-xl focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none resize-none" placeholder="e.g. sloping terrain, mixed soil..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="px-6 py-4 border-2 border-[#E2EAE7] text-[#5A7068] font-bold rounded-xl hover:bg-gray-50 transition-all">Back</button>
                <button onClick={() => setStep(3)} disabled={!farmSize}
                  className="flex-1 py-4 bg-[#1D9E75] text-white font-bold rounded-xl hover:bg-[#0F6E56] transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-lg shadow-green-900/10">
                  Continue <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="w-14 h-14 bg-[#1D9E75]/10 rounded-2xl flex items-center justify-center mb-2">
                <Ruler className="text-[#1D9E75]" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-[#1E2D2F]">Final Check</h2>
              
              <div className="bg-[#1E2D2F] rounded-2xl p-6 text-white space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1D9E75]">Farmer Digital ID</span>
                  <span className="text-[10px] font-medium text-white/40">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="text-xl font-mono tracking-wider">{localStorage.getItem('fasal_farmer_id') || 'FASAL-TEMP'}</div>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-2 border-t border-white/10">
                  <div><p className="text-[10px] uppercase text-white/50 mb-0.5">District</p><p className="font-bold">{district}</p></div>
                  <div><p className="text-[10px] uppercase text-white/50 mb-0.5">Water Source</p><p className="font-bold">{waterSource}</p></div>
                  <div><p className="text-[10px] uppercase text-white/50 mb-0.5">Farm Size</p><p className="font-bold">{farmSize} Acres</p></div>
                  <div><p className="text-[10px] uppercase text-white/50 mb-0.5">Soil Profile</p><p className="font-bold text-[#1D9E75]">{locationData?.profile?.soil_type || 'Red Loamy'}</p></div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="px-6 py-4 border-2 border-[#E2EAE7] text-[#5A7068] font-bold rounded-xl hover:bg-gray-50 transition-all">Back</button>
                <button onClick={completeSetup} disabled={loading}
                  className="flex-1 py-4 bg-[#1D9E75] text-white font-bold rounded-xl hover:bg-[#0F6E56] transition-all disabled:opacity-50 shadow-lg shadow-green-900/10">
                  {loading ? "Generating Engine..." : "Create My Engine"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
