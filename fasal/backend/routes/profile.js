import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { reverseGeocode, forwardGeocode } from '../lib/nominatim.js';
import { getWeather } from '../lib/weather.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const districtSoil = require('../data/district-soil.json');
const districtCoords = require('../data/district-coords.json');

const router = Router();

// POST /api/profile/setup
router.post('/setup', async (req, res) => {
  try {
    const userId = req.userId; // User ID from token
    const { latitude, longitude, district_manual, soil_override, water_source, farm_size, misc_notes } = req.body;

    let district, lat, lon, detectedDisplayName;

    if (latitude && longitude) {
      lat = latitude; 
      lon = longitude;
      try {
        console.log(`Backend: Starting reverse geocode for ${lat}, ${lon}`);
        const geo = await reverseGeocode(lat, lon);
        console.log('Backend: Geocode result:', geo);
        district = geo.district;
        detectedDisplayName = geo.display_name;
      } catch (e) {
        console.error('Reverse geocode failed:', e.message);
        district = 'Kolar'; // Fallback
      }
    } else if (district_manual) {
      district = district_manual;
      const coords = districtCoords[district];
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
      } else {
        lat = 13.0; 
        lon = 77.0;
      }
    } else {
      return res.status(400).json({ error: 'latitude/longitude or district_manual required' });
    }

    const soilType = soil_override || districtSoil[district] || 'Red Loamy';

    let weatherData = null;
    try {
      weatherData = await getWeather(lat, lon);
    } catch (e) {
      console.error('Weather fetch error:', e.message);
    }

    const { data: profileObj, error: fetchError } = await supabase.from('farmer_profiles')
      .select('*').eq('user_id', userId).maybeSingle();
    
    if (fetchError) {
      console.error('Fetch Profile Error:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    const farmerId = profileObj?.farmer_id || `KAR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    const payload = {
      user_id: userId,
      farmer_id: farmerId,
      name: profileObj?.name || 'Farmer',
      latitude: lat, 
      longitude: lon,
      district, 
      soil_type: soilType,
      water_source: water_source || 'Rainfed',
      farm_size: farm_size || 1,
      misc_notes: misc_notes || null
    };

    let opResult;
    if (profileObj) {
      opResult = await supabase.from('farmer_profiles')
        .update(payload)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      opResult = await supabase.from('farmer_profiles')
        .insert(payload)
        .select()
        .single();
    }

    const { data: updatedProfile, error: opError } = opResult;

    if (opError) {
      console.error('Supabase Setup Error:', JSON.stringify(opError, null, 2));
      return res.status(500).json({ error: opError.message });
    }

    if (updatedProfile && updatedProfile.id) {
      try {
        await supabase.from('crop_predictions').delete()
          .eq('profile_id', updatedProfile.id)
          .is('selected_crop', null);
      } catch (err) {}
    }

    res.json({ 
      profile: {
        ...updatedProfile,
        district: district || updatedProfile?.district,
        display_name: detectedDisplayName || profileObj?.display_name || updatedProfile?.display_name || null
      }, 
      weather: weatherData 
    });
  } catch (e) {
    console.error('Profile setup error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/profile/search-location
router.post('/search-location', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    const results = await forwardGeocode(query);
    res.json({ results });
  } catch (e) {
    console.error('Location search error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('farmer_profiles')
      .select('*').eq('user_id', req.userId).single();
    if (error) return res.status(404).json({ error: 'Profile not found' });

    const month = new Date().getMonth() + 1;
    let season;
    const year = new Date().getFullYear();
    if (month >= 6 && month <= 10) season = `Kharif ${year}`;
    else if (month >= 11 || month <= 3) season = `Rabi ${year}-${(year + 1) % 100}`;
    else season = `Zaid ${year}`;

    const { data: timeline } = await supabase.from('grow_timelines')
      .select('*').eq('profile_id', data.id).eq('status', 'growing').maybeSingle();

    res.json({
      ...data,
      current_season: season,
      active_timeline: timeline ? {
        crop: timeline.crop,
        current_week: timeline.current_week,
        harvest_window_week: timeline.harvest_window_week,
        status: timeline.status
      } : null
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
