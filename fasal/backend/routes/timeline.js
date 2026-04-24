import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { askGemini } from '../lib/gemini.js';
import { getWeather } from '../lib/weather.js';
import { getNDVIAnalysis } from '../lib/satellite.js';

const router = Router();

// POST /api/timeline
router.post('/', async (req, res) => {
  try {
    const { prediction_id, crop, planting_date } = req.body;
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('*').eq('user_id', req.userId).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // Also update the prediction with the selected crop
    if (prediction_id) {
      await supabase.from('crop_predictions')
        .update({ selected_crop: crop }).eq('id', prediction_id);
    }

    // 1. Fetch NDVI analysis for the farm location
    console.log(`Timeline: Fetching NDVI for ${crop} at ${profile.latitude}, ${profile.longitude}`);
    let ndviAnalysis = null;
    try {
      ndviAnalysis = await getNDVIAnalysis(
        profile.latitude, profile.longitude, crop, planting_date
      );
      console.log('Timeline: NDVI analysis ready -', ndviAnalysis.crop_profile.total_weeks, 'weeks,', ndviAnalysis.observations_count, 'observations');
    } catch (e) {
      console.error('NDVI analysis failed, continuing without:', e.message);
    }

    // 2. Build the AI prompt with NDVI data included
    const ndviContext = ndviAnalysis ? `
NDVI Satellite Data Available:
- Total growing weeks: ${ndviAnalysis.crop_profile.total_weeks}
- Peak NDVI expected at week ${ndviAnalysis.crop_profile.peak_week} (value: ${ndviAnalysis.crop_profile.expected_peak_ndvi})
- Growth phases detected: ${ndviAnalysis.weekly_ndvi.map(w => `W${w.week}:${w.phase}`).join(', ')}
- Use these NDVI phases to align your weekly tasks precisely.
- For each week, include the expected NDVI range in the detail field.
` : '';

    const raw = await askGemini(
      'You are an agricultural advisor for Karnataka. Return ONLY valid JSON. No markdown, no explanation.',
      `Generate a week-by-week growing timeline.

Crop: ${crop}
Planting date: ${planting_date}
District: ${profile.district}
Soil: ${profile.soil_type}
Water: ${profile.water_source}
${ndviContext}

Return this exact JSON structure (you MUST generate EXACTLY ${ndviAnalysis?.crop_profile.total_weeks || 10} weeks, and each week MUST have UNIQUE, progression-based tasks matching the crop's real lifecycle and the provided NDVI phases):
{
  "weeks": [
    {
      "week": 1,
      "title": "[Unique Title for Week 1, e.g. Land preparation]",
      "task": "[Unique Task description]",
      "detail": "[Unique Detail]. Expected NDVI: [Range]",
      "critical": false,
      "inputs_needed": "[Inputs]",
      "irrigation": "[Irrigation needs]"
    },
    {
      "week": 2,
      "title": "[Unique Title for Week 2, e.g. Germination monitoring]",
      "task": "[...]",
      "detail": "[...]",
      "critical": false,
      "inputs_needed": "[...]",
      "irrigation": "[...]"
    }
    // ... continue for ALL weeks up to ${ndviAnalysis?.crop_profile.total_weeks || 10}
  ],
  "harvest_window_week": ${ndviAnalysis?.crop_profile.total_weeks || 10},
  "harvest_note": "Harvest when 70% of fruits show mature colour"
}`
    );
    const timeline = JSON.parse(raw);

    // 3. Check weather alerts
    let weatherAlerts = [];
    try {
      const weather = await getWeather(profile.latitude, profile.longitude);
      const forecast = weather.daily;
      for (let i = 30; i < Math.min(37, forecast.precip.length); i++) {
        if (forecast.precip[i] > 10) {
          weatherAlerts.push({
            date: forecast.dates[i],
            type: 'rain',
            message: `Heavy rain forecast (${forecast.precip[i]}mm)`,
            action: 'Delay irrigation, ensure drainage'
          });
        }
        if (forecast.temp_max[i] > 38) {
          weatherAlerts.push({
            date: forecast.dates[i],
            type: 'heat',
            message: `High temperature forecast (${forecast.temp_max[i]}°C)`,
            action: 'Provide shade cover if possible'
          });
        }
      }
    } catch (e) {
      console.error('Weather alert error:', e.message);
    }

    // 4. Save timeline to database
    const { data: saved } = await supabase.from('grow_timelines').insert({
      prediction_id: prediction_id || null,
      profile_id: profile.id,
      crop,
      planting_date,
      weeks: timeline.weeks,
      harvest_window_week: timeline.harvest_window_week,
      current_week: 1,
      status: 'growing'
    }).select().single();

    // 5. Return everything including NDVI data
    res.json({
      id: saved?.id,
      ...timeline,
      ndvi_analysis: ndviAnalysis,
      weather_alerts: weatherAlerts
    });
  } catch (e) {
    console.error('Timeline error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/timeline/active
router.get('/active', async (req, res) => {
  try {
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('*').eq('user_id', req.userId).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const { data: timeline } = await supabase.from('grow_timelines')
      .select('*').eq('profile_id', profile.id).in('status', ['growing', 'ready'])
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (!timeline) return res.json({ active: false });

    // Re-generate NDVI analysis on the fly (lightweight, no API call)
    let ndviAnalysis = null;
    try {
      ndviAnalysis = await getNDVIAnalysis(
        profile.latitude, profile.longitude, timeline.crop, timeline.planting_date
      );
    } catch (e) {
      console.error('NDVI re-analysis failed:', e.message);
    }

    // Get weather alert for this week
    let weather_alert = null;
    try {
      const weather = await getWeather(profile.latitude, profile.longitude);
      const precip = weather.daily.precip.slice(30, 35);
      const maxRain = Math.max(...precip);
      if (maxRain > 10) {
        weather_alert = {
          message: `Heavy rain expected (${Math.round(maxRain)}mm)`,
          action: 'Delay irrigation, ensure field drainage'
        };
      }
    } catch (e) { /* ignore */ }

    const currentWeekData = timeline.weeks[timeline.current_week - 1] || null;
    const daysToHarvest = (timeline.harvest_window_week - timeline.current_week) * 7;

    res.json({
      active: true,
      ...timeline,
      current_week_data: currentWeekData,
      days_to_harvest: Math.max(0, daysToHarvest),
      weather_alert,
      ndvi_analysis: ndviAnalysis
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/timeline/:id/advance
router.patch('/:id/advance', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: timeline } = await supabase.from('grow_timelines')
      .select('*').eq('id', id).single();
    if (!timeline) return res.status(404).json({ error: 'Timeline not found' });

    const newWeek = timeline.current_week + 1;
    const harvestReady = newWeek >= timeline.harvest_window_week;

    const { data: updated } = await supabase.from('grow_timelines')
      .update({
        current_week: newWeek,
        status: harvestReady ? 'ready' : 'growing'
      })
      .eq('id', id).select().single();

    res.json({ ...updated, harvest_ready: harvestReady });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
