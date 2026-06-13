import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { askGemini } from '../lib/gemini.js';
import { getWeather } from '../lib/weather.js';
import { getCropPhotosParallel } from '../lib/unsplash.js';

const router = Router();

// ── POST /api/predict ──────────────────────────────
router.post('/', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Predict started for user: ${req.userId}`);
  try {
    const { season } = req.body;
    // STEP 1 — Load profile
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('*').eq('user_id', req.userId).single();
    if (!profile) {
      console.log(`[${requestId}] Profile not found for ${req.userId}`);
      return res.status(404).json({ error: 'Profile not found' });
    }
    console.log(`[${requestId}] Profile loaded: ${profile.district}, ${profile.soil_type}`);

    // STEP 2 — Fetch live weather
    console.log(`[${requestId}] Fetching weather...`);
    let weather;
    try {
      weather = await getWeather(profile.latitude, profile.longitude);
    } catch (e) {
      console.error(`[${requestId}] Weather fetch failed:`, e.message);
      // Fallback averages for Karnataka
      weather = {
        current: { temp: 28, humidity: 65, precipitation: 0, weather_code: 0, wind_speed: 8 },
        summary: { temp_min: 22, temp_max: 35, temp_avg: 28, humidity: 65, rainfall_30d: 80, rainfall_7d: 20, rain_days_next5: 2, summary_string: '28°C avg · 65% humidity · 80mm rain last 30 days · 20mm forecast' },
        daily: { dates: [], precip: [], temp_max: [], temp_min: [], et0: [] }
      };
    }
    const ws = weather.summary;
    console.log(`[${requestId}] Weather loaded: ${ws.temp_avg}C`);

    // STEP 3 — Build and call Gemini
    console.log(`[${requestId}] Calling Gemini...`);
    const systemPrompt = `You are an expert agronomist specializing in Karnataka's semi-arid regions (Tumakuru, Tiptur, etc.). 
CRITICAL KNOWLEDGE:
- KHARIF (June-Oct): Major rains. Ragi, Maize, Paddy, Groundnut.
- RABI (Nov-Feb): Residual moisture. Horse gram, Bengal gram, Jowar.
- ZAID (March-May): Summer. VERY HOT. Only short-duration pulses (Green gram, Cowpea) or irrigated crops.
- RAINFED ZAID: Extremely risky. Only suggest drought-hardy, short-duration (9-10 weeks) crops like Horse Gram or Green Gram.
- NO RAINFED RAGI IN ZAID: Ragi is a Kharif crop. Recommending it for rainfed summer is a major error.

Always return ONLY valid JSON.`;
    const userPrompt = `A farmer in ${profile.district} needs crop recommendations. Rank exactly 10 crops for ${season || detectSeason()}.

FARMER PROFILE:
- District: ${profile.district}
- Soil: ${profile.soil_type}
- Water: ${profile.water_source}
- Farm size: ${profile.farm_size} acres

SCORING RULES:
- success_pct (0-100) must reflect agronomic fit
- input_cost_per_acre must be realistic INR
- advisable = false if success_pct < 65

Return ONLY JSON:
{
  "crops": [
    {
      "name": "Green Gram",
      "kannada_name": "ಹೆಸರು ಕಾಳು",
      "success_pct": 88,
      "advisable": true,
      "reason": "2-3 sentence agronomic explanation including why it fits the current Zaid weather.",
      "input_cost_per_acre": 12000,
      "cost_breakdown": { "seeds": 1500, "fertiliser": 3500, "pesticide": 1000, "labour": 6000 },
      "water_requirement": "low",
      "season_fit": "excellent",
      "duration_weeks": 10,
      "expected_yield_per_acre": "4-6 quintals",
      "expected_price_range": "70-90",
      "best_sowing_window": "March-April",
      "soil_compatibility": "high",
      "market_demand": "high",
      "risk_factors": ["risk factor 1"]
    }
  ],
  "recommended": "Green Gram",
  "recommended_reason": "Detailed logic.",
  "season_note": "Weather summary.",
  "soil_health_note": "Rotation advice."
}`;

    let predictions;
    try {
      const raw = await askGemini(systemPrompt, userPrompt);
      predictions = JSON.parse(raw);
    } catch (parseErr) {
      console.error(`[${requestId}] Gemini parse failed, retrying with tiny prompt:`, parseErr.message);
      const retryRaw = await askGemini(systemPrompt, userPrompt + '\n\nIMPORTANT: Only return 10 crops. MAX 10 words for any text field. Return ONLY JSON.');
      try {
        predictions = JSON.parse(retryRaw);
      } catch (retryErr) {
        console.error(`[${requestId}] FINAL FAIL. RAW:`, retryRaw?.substring(0, 500));
        throw new Error('AI analysis failed. Please try again.');
      }
    }
    console.log(`[${requestId}] Gemini response parsed successfully.`);

    // STEP 4 — Fetch crop photos in parallel
    console.log(`[${requestId}] Fetching crop photos...`);
    const cropNames = predictions.crops.map(c => c.name);
    const photos = await getCropPhotosParallel(cropNames);
    predictions.crops = predictions.crops.map(c => ({
      ...c,
      photo_url: photos[c.name]?.photo_url || null,
      photo_thumb: photos[c.name]?.photo_thumb || null,
      photo_credit: photos[c.name]?.photo_credit || null
    }));
    console.log(`[${requestId}] Photos loaded.`);

    // STEP 5 — Next season suggestion removed to optimize response time
    // The frontend already fetches this asynchronously via GET /api/predict/next-season
    let nextSeasonSuggestion = null;

    // STEP 6 — Save to database
    const { data: saved } = await supabase.from('crop_predictions').insert({
      profile_id: profile.id,
      season: season || detectSeason(),
      weather_snapshot: weather.summary,
      predictions,
      selected_crop: null,
      input_cost_per_acre: null
    }).select().single();

    // STEP 7 — Return full response
    res.json({
      prediction_id: saved?.id,
      season: season || detectSeason(),
      weather: weather.summary,
      crops: predictions.crops,
      recommended: predictions.recommended,
      recommended_reason: predictions.recommended_reason,
      season_note: predictions.season_note,
      soil_health_note: predictions.soil_health_note,
      next_season_suggestion: nextSeasonSuggestion
    });
  } catch (e) {
    console.error('Predict error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/predict/latest ────────────────────────
router.get('/latest', async (req, res) => {
  try {
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('id').eq('user_id', req.userId).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const { data: prediction } = await supabase.from('crop_predictions')
      .select('*').eq('profile_id', profile.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (!prediction) return res.json({ exists: false });

    res.json({
      exists: true,
      prediction_id: prediction.id,
      season: prediction.season,
      weather: prediction.weather_snapshot,
      crops: prediction.predictions?.crops || [],
      recommended: prediction.predictions?.recommended,
      recommended_reason: prediction.predictions?.recommended_reason,
      season_note: prediction.predictions?.season_note,
      soil_health_note: prediction.predictions?.soil_health_note,
      selected_crop: prediction.selected_crop,
      input_cost_per_acre: prediction.input_cost_per_acre
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PATCH /api/predict/:id/select ──────────────────
router.patch('/:id/select', async (req, res) => {
  try {
    const { id } = req.params;
    const { crop_name, planting_date } = req.body;

    // Get prediction to find cost
    const { data: prediction } = await supabase.from('crop_predictions')
      .select('predictions').eq('id', id).single();
    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });

    const matchedCrop = prediction.predictions?.crops?.find(c => c.name === crop_name);
    const inputCost = matchedCrop?.input_cost_per_acre || null;

    const { data: updated } = await supabase.from('crop_predictions')
      .update({
        selected_crop: crop_name,
        input_cost_per_acre: inputCost
      })
      .eq('id', id).select().single();

    res.json({
      prediction_id: updated?.id,
      selected_crop: crop_name,
      input_cost_per_acre: inputCost
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/predict/next-season ───────────────────
router.get('/next-season', async (req, res) => {
  try {
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('*').eq('user_id', req.userId).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const { data: history } = await supabase.from('season_history')
      .select('*').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(2);

    if (!history || history.length === 0) return res.json({ available: false });

    const weather = await getWeather(profile.latitude, profile.longitude);
    const month = new Date().getMonth() + 1;
    let nextSeason;
    if (month >= 6 && month <= 9) nextSeason = 'Rabi';
    else if (month >= 10 || month <= 1) nextSeason = 'Zaid';
    else nextSeason = 'Kharif';

    const raw = await askGemini(
      'Agricultural advisor for Karnataka. Return ONLY valid JSON. No markdown.',
      `Given this farmer's history, recommend next season crop.
History: ${JSON.stringify(history)}
Current soil: ${profile.soil_type}
Next season: ${nextSeason}
Current conditions: ${weather.summary.summary_string}

Return:
{
  "suggested_crop": "Ragi",
  "kannada_name": "ರಾಗಿ",
  "reason": "2-3 sentence agronomic reason",
  "confidence": "high",
  "rotation_health": "good",
  "rotation_note": "one line soil rotation tip",
  "estimated_success_pct": 82
}`
    );
    const suggestion = JSON.parse(raw);
    res.json({ available: true, ...suggestion });
  } catch (e) {
    console.error('Next season error:', e);
    res.status(500).json({ error: e.message });
  }
});

function detectSeason() {
  const m = new Date().getMonth() + 1;
  const y = new Date().getFullYear();
  if (m >= 6 && m <= 10) return `Kharif ${y}`;
  if (m >= 11 || m <= 3) return `Rabi ${y}-${(y + 1) % 100}`;
  return `Zaid ${y}`;
}

export default router;
