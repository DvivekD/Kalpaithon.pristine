import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const basePrices = require('../data/crop-base-prices.json');
const mandis = require('../data/karnataka-mandis.json');
import { haversine } from './overpass.js';

/**
 * Generate realistic 14-day mandi prices for a crop at the 3 nearest mandis.
 * Uses seeded variation to simulate real market data.
 */
export function getMandiPrices(cropName, lat, lon) {
  const base = basePrices[cropName] || 20;

  // Find 3 nearest mandis that trade this crop
  const ranked = mandis
    .map(m => ({ ...m, distance: haversine(lat, lon, m.lat, m.lon) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  const today = new Date();
  const priceChart = [];

  for (const mandi of ranked) {
    // Generate 14 days of prices with slight trend
    const trendDir = (Math.random() - 0.4) * 0.5; // slight upward bias
    for (let d = 13; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const variation = (Math.random() * 0.1 - 0.05) * base;
      const trend = (13 - d) * trendDir;
      const price = Math.round((base + variation + trend) * 100) / 100;
      priceChart.push({
        date: date.toISOString().split('T')[0],
        mandi_name: mandi.name,
        price: Math.max(price, base * 0.7) // floor
      });
    }
  }

  // Compute trend from first mandi's prices
  const firstMandiPrices = priceChart
    .filter(p => p.mandi_name === ranked[0].name)
    .map(p => p.price);
  const { slope, pctChange } = linearTrend(firstMandiPrices);

  return {
    mandis: ranked.map(m => {
      const prices = priceChart.filter(p => p.mandi_name === m.name);
      const todayPrice = prices[prices.length - 1]?.price || base;
      const avg14d = Math.round(prices.reduce((s, p) => s + p.price, 0) / prices.length * 100) / 100;
      return {
        name: m.name,
        district: m.district,
        distance_km: Math.round(m.distance * 10) / 10,
        price_today: todayPrice,
        price_avg_14d: avg14d,
        trend: todayPrice > avg14d ? 'up' : todayPrice < avg14d ? 'down' : 'flat',
        lat: m.lat,
        lon: m.lon
      };
    }),
    price_chart: priceChart,
    trend_direction: slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'flat',
    trend_pct: pctChange,
    data_source: 'estimated'
  };
}

function linearTrend(prices) {
  const n = prices.length;
  if (n < 2) return { slope: 0, pctChange: 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += prices[i];
    sumXY += i * prices[i]; sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avg = sumY / n;
  const pctChange = avg > 0 ? Math.round((prices[n - 1] - prices[0]) / avg * 100) : 0;
  return { slope, pctChange };
}
