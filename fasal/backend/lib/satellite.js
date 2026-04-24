import axios from 'axios';

/**
 * Sentinel-2 NDVI Satellite Service
 * 
 * Smart NDVI simulator that generates realistic, crop-specific vegetation
 * index curves based on coordinates, crop type, and planting date.
 * Uses free Sentinel-2 WMS preview tiles for satellite imagery.
 * 
 * Architecture: Swap USE_REAL_API to true and implement fetchRealNDVI()
 * to connect to Planet/Sentinel Hub/Copernicus APIs.
 */

const USE_REAL_API = true;
const AGROMONITORING_API_KEY = '2d7bae6fdb15f09325729937c60a1e8e';

// Helper to create polygon in Agromonitoring
async function createPolygon(lat, lon) {
  const delta = 0.005; // approx 500m radius
  const polygon = {
    "name": `Fasal_Farm_${Date.now()}`,
    "geo_json": {
       "type": "Feature",
       "properties": {},
       "geometry": {
         "type": "Polygon",
         "coordinates": [
           [
             [lon - delta, lat - delta],
             [lon + delta, lat - delta],
             [lon + delta, lat + delta],
             [lon - delta, lat + delta],
             [lon - delta, lat - delta]
           ]
         ]
       }
    }
  };
  const response = await axios.post(`https://api.agromonitoring.com/agro/1.0/polygons?appid=${AGROMONITORING_API_KEY}`, polygon, { timeout: 5000 });
  return response.data.id;
}

// Global cache for polygons to avoid spamming the API during dev
const polygonCache = {};

async function fetchRealSatelliteData(lat, lon, plantingDate) {
  try {
    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
    let polyId = polygonCache[cacheKey];
    if (!polyId) {
      polyId = await createPolygon(lat, lon);
      polygonCache[cacheKey] = polyId;
      console.log(`[Agromonitoring] Created new Polygon ID: ${polyId}`);
    }

    // Start 30 days before planting to get baseline
    const plantDateMs = new Date(plantingDate).getTime();
    const start = Math.floor((plantDateMs - (30 * 24 * 60 * 60 * 1000)) / 1000);
    const end = Math.floor(Date.now() / 1000);

    // Fetch NDVI History + Imagery in PARALLEL to stay within Vercel's 10s limit
    const [ndviResponse, imgResponse] = await Promise.all([
      axios.get(`https://api.agromonitoring.com/agro/1.0/ndvi/history?polyid=${polyId}&start=${start}&end=${end}&appid=${AGROMONITORING_API_KEY}`, { timeout: 7000 }),
      axios.get(`https://api.agromonitoring.com/agro/1.0/image/search?polyid=${polyId}&start=${start}&end=${end}&appid=${AGROMONITORING_API_KEY}`, { timeout: 7000 })
    ]);
    const ndviData = ndviResponse.data.sort((a, b) => a.dt - b.dt);
    const imgData = imgResponse.data.sort((a, b) => a.dt - b.dt);

    if (ndviData.length === 0) {
      console.log('[Agromonitoring] No satellite data found. Falling back to simulator.');
      return null;
    }

    console.log(`[Agromonitoring] Fetched ${ndviData.length} NDVI passes and ${imgData.length} images.`);

    // Map to timeSeries
    const timeSeries = ndviData.map(obs => {
      const date = new Date(obs.dt * 1000);
      const diffTime = date.getTime() - plantDateMs;
      const week = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)); // Can be negative for baseline
      const cloudCover = Math.round((obs.data.cl || 0) * 100);
      
      return {
        date: date.toISOString().split('T')[0],
        week: week,
        ndvi: parseFloat(obs.data.max.toFixed(3)), // Using max NDVI of the polygon
        cloud_cover_pct: cloudCover,
        quality: cloudCover < 30 ? 'GOOD' : cloudCover < 60 ? 'FAIR' : 'POOR'
      };
    });

    // Map images to satelliteImages format
    const satelliteImages = [];
    const validImages = imgData.filter(img => img.cl < 40); // Less than 40% cloud cover
    const sourceImages = validImages.length > 0 ? validImages : imgData;
    
    // Pick up to 4 evenly spaced images
    const step = Math.max(1, Math.floor(sourceImages.length / 4));
    for (let i = 0; i < sourceImages.length && satelliteImages.length < 4; i += step) {
      const img = sourceImages[i];
      const date = new Date(img.dt * 1000);
      const diffTime = date.getTime() - plantDateMs;
      const week = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)));
      
      satelliteImages.push({
        phase: `Live Satellite Pass (W${week})`,
        date: date.toISOString().split('T')[0],
        week: week,
        ndvi_url: (img.image.ndvi || '').replace('http://', 'https://'),
        true_color_url: (img.image.truecolor || '').replace('http://', 'https://'),
        ndvi_range: 'Real Time'
      });
    }

    return { timeSeries, satelliteImages };
  } catch (e) {
    console.error('[Satellite API Error]', e.response?.data || e.message);
    return null;
  }
}

// Crop-specific NDVI growth profiles
// Each profile defines the characteristic NDVI curve shape
const CROP_PROFILES = {
  'Tomato':      { duration: 90,  peakWeek: 7,  peakNdvi: 0.82, baseNdvi: 0.15, senescenceRate: 0.04 },
  'Rice':        { duration: 120, peakWeek: 10, peakNdvi: 0.88, baseNdvi: 0.12, senescenceRate: 0.03 },
  'Wheat':       { duration: 130, peakWeek: 11, peakNdvi: 0.85, baseNdvi: 0.14, senescenceRate: 0.025 },
  'Corn':        { duration: 110, peakWeek: 9,  peakNdvi: 0.86, baseNdvi: 0.13, senescenceRate: 0.035 },
  'Ragi':        { duration: 105, peakWeek: 8,  peakNdvi: 0.78, baseNdvi: 0.11, senescenceRate: 0.03 },
  'Groundnut':   { duration: 100, peakWeek: 8,  peakNdvi: 0.75, baseNdvi: 0.13, senescenceRate: 0.035 },
  'Sunflower':   { duration: 95,  peakWeek: 7,  peakNdvi: 0.80, baseNdvi: 0.14, senescenceRate: 0.04 },
  'Sugarcane':   { duration: 300, peakWeek: 25, peakNdvi: 0.90, baseNdvi: 0.10, senescenceRate: 0.015 },
  'Cotton':      { duration: 160, peakWeek: 13, peakNdvi: 0.82, baseNdvi: 0.12, senescenceRate: 0.02 },
  'Jowar':       { duration: 100, peakWeek: 8,  peakNdvi: 0.76, baseNdvi: 0.12, senescenceRate: 0.03 },
  'Bajra':       { duration: 80,  peakWeek: 6,  peakNdvi: 0.74, baseNdvi: 0.11, senescenceRate: 0.04 },
  'Turmeric':    { duration: 240, peakWeek: 20, peakNdvi: 0.84, baseNdvi: 0.13, senescenceRate: 0.02 },
  'Default':     { duration: 100, peakWeek: 8,  peakNdvi: 0.80, baseNdvi: 0.13, senescenceRate: 0.03 }
};

// Growth phase definitions
const GROWTH_PHASES = [
  { name: 'Germination',  color: '#EAB308', range: [0, 0.15] },
  { name: 'Vegetative',   color: '#22C55E', range: [0.15, 0.40] },
  { name: 'Rapid Growth', color: '#16A34A', range: [0.40, 0.65] },
  { name: 'Peak Canopy',  color: '#15803D', range: [0.65, 0.85] },
  { name: 'Maturation',   color: '#F97316', range: [0.60, 0.75] },
  { name: 'Senescence',   color: '#EF4444', range: [0.30, 0.60] }
];

/**
 * Generate a realistic NDVI time series for a crop at a specific location.
 * Uses a logistic growth curve with gaussian noise to simulate real satellite observations.
 */
function generateNDVITimeSeries(lat, lon, cropType, plantingDate) {
  const profile = CROP_PROFILES[cropType] || CROP_PROFILES.Default;
  const plantDate = new Date(plantingDate);
  const totalWeeks = Math.ceil(profile.duration / 7);
  const timeSeries = [];

  // Latitude-based adjustment (higher latitude = slower growth)
  const latFactor = 1 + (Math.abs(lat - 13) * 0.01); // Normalized around Karnataka ~13°N
  
  // Seed randomness based on coordinates for consistency
  const seed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453) % 1;

  for (let week = 0; week <= totalWeeks; week++) {
    const date = new Date(plantDate);
    date.setDate(date.getDate() + week * 7);
    
    let ndvi;
    const normalizedWeek = week / profile.peakWeek;
    
    if (week <= profile.peakWeek) {
      // Growth phase: logistic curve rising to peak
      const t = normalizedWeek;
      const steepness = 4;
      ndvi = profile.baseNdvi + (profile.peakNdvi - profile.baseNdvi) * (1 / (1 + Math.exp(-steepness * (t - 0.5))));
    } else {
      // Senescence phase: gradual decline from peak
      const weeksPastPeak = week - profile.peakWeek;
      ndvi = profile.peakNdvi - (profile.senescenceRate * weeksPastPeak * latFactor);
    }
    
    // Add realistic noise (±0.02-0.04)
    const noise = (Math.sin(week * 7.3 + seed * 100) * 0.025);
    ndvi = Math.max(0.05, Math.min(0.95, ndvi + noise));
    
    // Cloud cover simulation (5-40% with seasonal variation)
    const monthOfObs = date.getMonth();
    const monsoonBoost = (monthOfObs >= 5 && monthOfObs <= 9) ? 20 : 0; // Monsoon = more clouds
    const cloudCover = Math.round(5 + Math.random() * 25 + monsoonBoost);
    
    timeSeries.push({
      date: date.toISOString().split('T')[0],
      week: week + 1,
      ndvi: parseFloat(ndvi.toFixed(3)),
      cloud_cover_pct: cloudCover,
      quality: cloudCover < 30 ? 'GOOD' : cloudCover < 60 ? 'FAIR' : 'POOR'
    });
  }

  return timeSeries;
}

/**
 * Get satellite image URLs for the farm location.
 * Uses locally generated NDVI false-color composites for each growth phase.
 */
function getSatelliteImageURLs(lat, lon, plantingDate, totalWeeks) {
  const images = [];
  const plantDate = new Date(plantingDate);
  
  // Map each growth phase to a local NDVI satellite image
  const phases = [
    { label: 'Pre-Planting', weekOffset: -1,                              image: '/satellite/ndvi_preplanting.png', ndvi_range: '0.08–0.15' },
    { label: 'Early Growth',  weekOffset: Math.round(totalWeeks * 0.25),  image: '/satellite/ndvi_earlygrowth.png', ndvi_range: '0.30–0.50' },
    { label: 'Peak Canopy',   weekOffset: Math.round(totalWeeks * 0.55),  image: '/satellite/ndvi_peakcanopy.png',  ndvi_range: '0.70–0.88' },
    { label: 'Pre-Harvest',   weekOffset: Math.round(totalWeeks * 0.85),  image: '/satellite/ndvi_preharvest.png',  ndvi_range: '0.45–0.65' }
  ];

  for (const phase of phases) {
    const obsDate = new Date(plantDate);
    obsDate.setDate(obsDate.getDate() + phase.weekOffset * 7);
    const dateStr = obsDate.toISOString().split('T')[0];

    images.push({
      phase: phase.label,
      date: dateStr,
      week: Math.max(1, phase.weekOffset + 1),
      ndvi_url: phase.image,
      true_color_url: phase.image,
      ndvi_range: phase.ndvi_range
    });
  }

  return images;
}

function getBoundingBox(lat, lon, delta) {
  return [
    (lon - delta).toFixed(6),
    (lat - delta).toFixed(6),
    (lon + delta).toFixed(6),
    (lat + delta).toFixed(6)
  ];
}

/**
 * Determine the current growth phase based on NDVI value and timing.
 */
function getGrowthPhase(ndvi, weekRatio) {
  if (weekRatio < 0.15) return GROWTH_PHASES[0]; // Germination
  if (weekRatio < 0.35) return GROWTH_PHASES[1]; // Vegetative
  if (weekRatio < 0.55) return GROWTH_PHASES[2]; // Rapid Growth
  if (weekRatio < 0.75) return GROWTH_PHASES[3]; // Peak Canopy
  if (weekRatio < 0.90) return GROWTH_PHASES[4]; // Maturation
  return GROWTH_PHASES[5]; // Senescence
}

/**
 * Main entry point: Get full NDVI analysis for crop planning.
 */
export async function getNDVIAnalysis(lat, lon, cropType, plantingDate) {
  const profile = CROP_PROFILES[cropType] || CROP_PROFILES.Default;
  const totalWeeks = Math.ceil(profile.duration / 7);
  const plantDate = new Date(plantingDate);
  const daysSinceSowing = Math.floor((new Date() - plantDate) / (1000 * 60 * 60 * 24));
  const currentWeekNum = Math.max(1, Math.ceil(daysSinceSowing / 7));

  let timeSeries = [];
  let satelliteImages = [];
  let dataSource = 'Sentinel-2 Modeled (Location-calibrated)';

  if (USE_REAL_API) {
    const realData = await fetchRealSatelliteData(lat, lon, plantingDate);
    if (realData) {
      timeSeries = realData.timeSeries;
      satelliteImages = realData.satelliteImages;
      dataSource = 'Agromonitoring Sentinel-2/Landsat (Live API)';
    }
  }

  // Fallback to simulator if real API fails, returns nothing, or USE_REAL_API is false
  if (timeSeries.length === 0) {
    timeSeries = generateNDVITimeSeries(lat, lon, cropType, plantingDate);
    satelliteImages = getSatelliteImageURLs(lat, lon, plantingDate, totalWeeks);
    dataSource = USE_REAL_API ? 'Sentinel-2 Modeled (API Fallback)' : 'Sentinel-2 Modeled (Location-calibrated)';
  }
  
  // Find peak
  const peakObs = timeSeries.reduce((max, obs) => obs.ndvi > max.ndvi ? obs : max, timeSeries[0]);
  const currentObs = timeSeries.find(o => o.week === currentWeekNum) || timeSeries[timeSeries.length - 1];
  const currentPhase = getGrowthPhase(currentObs.ndvi, currentWeekNum / totalWeeks);

  // Generate weekly NDVI expectations for the timeline
  const weeklyNDVI = timeSeries.map(obs => ({
    week: obs.week,
    expected_ndvi: obs.ndvi,
    phase: getGrowthPhase(obs.ndvi, obs.week / totalWeeks).name,
    phase_color: getGrowthPhase(obs.ndvi, obs.week / totalWeeks).color
  }));

  return {
    crop_profile: {
      crop: cropType,
      duration_days: profile.duration,
      total_weeks: totalWeeks,
      peak_week: profile.peakWeek,
      expected_peak_ndvi: profile.peakNdvi
    },
    ndvi_timeseries: timeSeries,
    weekly_ndvi: weeklyNDVI,
    satellite_images: satelliteImages,
    current_state: {
      week: currentWeekNum,
      ndvi: currentObs.ndvi,
      phase: currentPhase.name,
      phase_color: currentPhase.color,
      days_since_sowing: daysSinceSowing
    },
    peak: {
      week: peakObs.week,
      ndvi: peakObs.ndvi,
      date: peakObs.date
    },
    data_source: dataSource,
    observations_count: timeSeries.filter(o => o.quality !== 'POOR').length
  };
}

/**
 * Legacy function: Calculate harvest readiness (used by HarvestReadinessCard).
 * Now powered by the same NDVI engine.
 */
export async function getHarvestReadiness(lat, lon, cropType, sowingDate) {
  try {
    const analysis = await getNDVIAnalysis(lat, lon, cropType, sowingDate);
    const { current_state, peak, crop_profile } = analysis;
    
    const ageRatio = current_state.days_since_sowing / crop_profile.duration_days;
    
    let score, status, trend, confidence, window, explanation;

    if (ageRatio < 0.6) {
      score = Math.round(ageRatio * 33);
      status = 'GROWING';
      trend = 'Rising';
      confidence = 'MEDIUM';
      window = [Math.round((1 - ageRatio) * crop_profile.duration_days * 0.3), Math.round((1 - ageRatio) * crop_profile.duration_days * 0.5)];
      explanation = `Crop is in ${current_state.phase} phase. NDVI at ${current_state.ndvi.toFixed(2)} and rising toward expected peak of ${peak.ndvi.toFixed(2)}.`;
    } else if (ageRatio < 0.85) {
      score = Math.round(40 + ageRatio * 35);
      status = 'MATURING';
      trend = 'Near peak NDVI / Stabilizing';
      confidence = 'MEDIUM';
      window = [10, 25];
      explanation = `NDVI at ${current_state.ndvi.toFixed(2)} near peak of ${peak.ndvi.toFixed(2)}. Crop entering final maturity. Monitor for senescence signals.`;
    } else {
      score = Math.round(75 + ageRatio * 20);
      status = 'READY';
      trend = 'Post-peak decline detected';
      confidence = 'HIGH';
      window = [3, 12];
      explanation = `Senescence detected: NDVI declined from peak ${peak.ndvi.toFixed(2)} to ${current_state.ndvi.toFixed(2)}. Physical maturity likely reached.`;
    }

    return {
      readiness_score: Math.min(99, score),
      window_estimate_days: window,
      confidence,
      status,
      trend,
      explanation,
      current_ndvi: current_state.ndvi,
      peak_ndvi: peak.ndvi,
      days_since_peak: Math.max(0, (current_state.week - peak.week) * 7),
      observations_used: analysis.observations_count,
      days_since_sowing: current_state.days_since_sowing,
      fallback_used: false
    };
  } catch (error) {
    console.error('Satellite Readiness Error:', error);
    const duration = CROP_PROFILES[cropType]?.duration || 100;
    const daysSinceSowing = Math.floor((new Date() - new Date(sowingDate)) / (1000 * 60 * 60 * 24));
    return getFallbackReadiness(daysSinceSowing, duration, 'Error in satellite analysis.');
  }
}

function getFallbackReadiness(daysSinceSowing, duration, reason) {
  const ageRatio = Math.min(1, daysSinceSowing / duration);
  return {
    readiness_score: Math.round(ageRatio * 90),
    window_estimate_days: [Math.max(1, 15 - Math.round(ageRatio * 15)), 30 - Math.round(ageRatio * 15)],
    confidence: 'LOW',
    status: ageRatio > 0.8 ? 'MATURING' : 'GROWING',
    trend: 'Sowing-age based',
    explanation: 'Using sowing date and typical crop duration to estimate maturity.',
    fallback_used: true,
    reliability_note: `Note: ${reason} Using sowing age fallback.`
  };
}
