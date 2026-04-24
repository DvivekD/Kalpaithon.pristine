import axios from 'axios';

export async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration&past_days=30&forecast_days=7&timezone=Asia/Kolkata`;
  const res = await axios.get(url, { timeout: 10000 });
  const d = res.data;
  const current = d.current;
  const daily = d.daily;

  // Compute summaries
  const rainfall30d = daily.precipitation_sum.slice(0, 30).reduce((a, b) => a + (b || 0), 0);
  const rainfall7d = daily.precipitation_sum.slice(30).reduce((a, b) => a + (b || 0), 0);
  const tempMax = Math.max(...daily.temperature_2m_max.filter(Boolean));
  const tempMin = Math.min(...daily.temperature_2m_min.filter(Boolean));

  // Average temp across all days
  const allTemps = daily.temperature_2m_max.map((mx, i) => {
    const mn = daily.temperature_2m_min[i];
    if (mx != null && mn != null) return (mx + mn) / 2;
    return null;
  }).filter(Boolean);
  const tempAvg = allTemps.length ? Math.round(allTemps.reduce((a, b) => a + b, 0) / allTemps.length * 10) / 10 : null;

  // Count rain days in next 5 days (for sell scoring)
  const forecastPrecip = daily.precipitation_sum.slice(30, 35);
  const rainDays = forecastPrecip.filter(p => p > 1).length;

  // Weather summary string
  const summaryStr = `${tempAvg}°C avg · ${current.relative_humidity_2m}% humidity · ${Math.round(rainfall30d)}mm rain last 30 days · ${Math.round(rainfall7d)}mm forecast next 7 days`;

  return {
    current: {
      temp: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      weather_code: current.weather_code,
      wind_speed: current.wind_speed_10m
    },
    summary: {
      temp_min: tempMin,
      temp_max: tempMax,
      temp_avg: tempAvg,
      humidity: current.relative_humidity_2m,
      rainfall_30d: Math.round(rainfall30d),
      rainfall_7d: Math.round(rainfall7d),
      rain_days_next5: rainDays,
      summary_string: summaryStr
    },
    daily: {
      dates: daily.time,
      precip: daily.precipitation_sum,
      temp_max: daily.temperature_2m_max,
      temp_min: daily.temperature_2m_min,
      et0: daily.et0_fao_evapotranspiration
    }
  };
}
