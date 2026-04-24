import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { getWeather } from '../lib/weather.js';
import { getMandiPrices } from '../lib/agmarknet.js';
import { findBuyers } from '../lib/overpass.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const shelfLife = require('../data/crop-shelf-life.json');

const router = Router();

// POST /api/sell
router.post('/', async (req, res) => {
  try {
    const { quantity_kg, days_stored = 0, cost_breakdown = null } = req.body;
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('*').eq('user_id', req.userId).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // Get active timeline
    const { data: timeline } = await supabase.from('grow_timelines')
      .select('*, crop_predictions(input_cost_per_acre)')
      .eq('profile_id', profile.id).in('status', ['growing', 'ready'])
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    const crop = timeline?.crop || 'Tomato';
    let inputTotal;

    if (cost_breakdown) {
      // Step 2: Calculate total input cost as sum of all cost fields
      inputTotal = (Number(cost_breakdown.seeds) || 0) +
        (Number(cost_breakdown.water) || 0) +
        (Number(cost_breakdown.fertilizer) || 0) +
        (Number(cost_breakdown.labor) || 0);
    } else {
      const inputCostPerAcre = timeline?.crop_predictions?.input_cost_per_acre || 14000;
      inputTotal = inputCostPerAcre * (profile.farm_size || 1);
    }

    // 1. Get mandi prices
    const mandiData = getMandiPrices(crop, profile.latitude, profile.longitude);
    const avgPrice = mandiData.mandis[0]?.price_today || 20;

    // 2. Step 2: Calculate total input cost
    let finalInputCost;
    if (cost_breakdown) {
      // If user manually enters costs, assume they are for the WHOLE quantity entered
      finalInputCost = (Number(cost_breakdown.seeds) || 0) +
        (Number(cost_breakdown.water) || 0) +
        (Number(cost_breakdown.fertilizer) || 0) +
        (Number(cost_breakdown.labor) || 0);
    } else {
      // Pro-rate the acre cost to the specific quantity kg
      // e.g. If it costs 14k to grow 1000kg (1 ton), then for 400kg it costs 5.6k
      const inputCostPerAcre = timeline?.crop_predictions?.input_cost_per_acre || 14000;
      const expectedYieldKg = 1000; // Fallback 1 ton/acre
      const costPerKg = inputCostPerAcre / expectedYieldKg;
      finalInputCost = costPerKg * quantity_kg;
    }

    // 2. Get weather
    const weather = await getWeather(profile.latitude, profile.longitude);
    const rainDays = weather.summary.rain_days_next5;

    // 3. Compute shelf life
    const cropShelf = shelfLife[crop] || 14;
    const remainingLife = cropShelf - days_stored;

    // 4. Compute Sell Window Score
    const slope = mandiData.trend_pct / 100;
    let priceScore;
    if (slope > 0.05) priceScore = 40;
    else if (slope > 0) priceScore = 25;
    else if (slope === 0) priceScore = 15;
    else priceScore = 0;

    let weatherScore;
    if (rainDays === 0) weatherScore = 30;
    else if (rainDays === 1) weatherScore = 20;
    else if (rainDays === 2) weatherScore = 10;
    else weatherScore = 0;

    let shelfScore;
    if (remainingLife > 10) shelfScore = 30;
    else if (remainingLife > 5) shelfScore = 15;
    else if (remainingLife > 2) shelfScore = 5;
    else shelfScore = 0;

    const totalScore = priceScore + weatherScore + shelfScore;
    let scoreWord, scoreColor;
    if (totalScore >= 70) { scoreWord = 'SELL'; scoreColor = 'green'; }
    else if (totalScore >= 40) { scoreWord = 'WAIT'; scoreColor = 'amber'; }
    else { scoreWord = 'STORE'; scoreColor = 'red'; }

    // 5. Compute net profit for each mandi
    const mandisWithProfit = mandiData.mandis.map(m => {
      const transportCost = 8 * m.distance_km * (quantity_kg / 1000);
      const gross = m.price_today * quantity_kg;
      const storageCost = 2 * quantity_kg * days_stored;
      const net = gross - transportCost - finalInputCost - storageCost;

      const totalCosts = transportCost + finalInputCost + storageCost;
      const marginPct = gross > 0 ? ((gross - totalCosts) / gross) * 100 : 0;

      return {
        ...m,
        transport_cost: Math.round(transportCost),
        net_per_quintal: Math.round((net / (quantity_kg / 100)) * 100) / 100,
        net_profit: Math.round(net),
        margin_pct: Math.round(marginPct * 10) / 10
      };
    });

    const bestMandi = mandisWithProfit.sort((a, b) => b.net_profit - a.net_profit)[0];

    // Compute wait gain
    const waitGain3Days = totalScore >= 40 ?
      Math.round(bestMandi.net_profit * Math.abs(mandiData.trend_pct) / 100 * 0.3) : 0;

    const weatherSummary = rainDays === 0 ? 'Clear weather — good for transport' :
      `${rainDays} rain day(s) expected — may affect quality`;

    // Reason
    let reason;
    if (scoreWord === 'SELL') reason = `Prices trending up ${mandiData.trend_pct}% — sell now for best returns`;
    else if (scoreWord === 'WAIT') reason = `Mixed signals — hold and monitor market for better window`;
    else reason = `Store safely — ${remainingLife <= 2 ? 'shelf life critical, sell ASAP' : 'prices declining, wait for recovery'}`;

    const result = {
      score: scoreWord,
      score_color: scoreColor,
      score_total: totalScore,
      reason,
      wait_gain_3days: waitGain3Days,
      price_chart: mandiData.price_chart,
      trend_direction: mandiData.trend_direction,
      trend_pct: mandiData.trend_pct,
      weather_summary: weatherSummary,
      mandis: mandisWithProfit,
      best_mandi: bestMandi.name,
      net_profit: bestMandi.net_profit,
      margin_pct: bestMandi.margin_pct,
      gross_revenue: Math.round(bestMandi.price_today * quantity_kg),
      input_cost: Math.round(finalInputCost),
      transport_cost: bestMandi.transport_cost,
      storage_cost: Math.round(2 * quantity_kg * days_stored),
      data_source: mandiData.data_source,
      suggested_selling_price: bestMandi.price_today,
      latitude: profile.latitude,
      longitude: profile.longitude
    };

    // Save
    await supabase.from('sell_decisions').insert({
      timeline_id: timeline?.id || null,
      profile_id: profile.id,
      quantity_kg,
      score: scoreWord,
      score_reason: reason,
      price_chart: mandiData.price_chart,
      mandi_data: mandisWithProfit,
      gross_revenue: result.gross_revenue,
      transport_cost: result.transport_cost,
      input_cost: result.input_cost,
      net_profit: result.net_profit
    });

    res.json(result);
  } catch (e) {
    console.error('Sell error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/buyers
router.get('/buyers', async (req, res) => {
  try {
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('latitude, longitude').eq('user_id', req.userId).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const buyers = await findBuyers(profile.latitude, profile.longitude);
    res.json({ buyers });
  } catch (e) {
    console.error('Buyers error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
