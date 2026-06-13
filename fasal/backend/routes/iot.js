import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// GET /api/iot/latest — Get the most recent sensor reading
router.get('/latest', async (req, res) => {
  try {
    const deviceId = req.query.device_id || 'fasal-node-001';

    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return res.status(404).json({ error: 'No sensor data found' });

    // Check if device is "online" (last reading within 2 minutes)
    const lastUpdate = new Date(data.created_at);
    const now = new Date();
    const diffMs = now - lastUpdate;
    const isOnline = diffMs < 120000; // 2 minutes

    res.json({
      ...data,
      is_online: isOnline,
      seconds_ago: Math.floor(diffMs / 1000)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/iot/history?hours=24 — Get historical readings for charting
router.get('/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const deviceId = req.query.device_id || 'fasal-node-001';
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('sensor_readings')
      .select('temperature, humidity, soil_moisture, created_at')
      .eq('device_id', deviceId)
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json({
      readings: data || [],
      count: data?.length || 0,
      period_hours: hours
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/iot/stats — Get aggregate stats
router.get('/stats', async (req, res) => {
  try {
    const deviceId = req.query.device_id || 'fasal-node-001';
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('sensor_readings')
      .select('temperature, humidity, soil_moisture')
      .eq('device_id', deviceId)
      .gte('created_at', since24h);

    if (error || !data || data.length === 0) {
      return res.json({ has_data: false });
    }

    const temps = data.map(d => d.temperature).filter(t => t !== null);
    const hums = data.map(d => d.humidity).filter(h => h !== null);
    const soils = data.map(d => d.soil_moisture).filter(s => s !== null);

    res.json({
      has_data: true,
      total_readings: data.length,
      temperature: {
        min: Math.min(...temps),
        max: Math.max(...temps),
        avg: +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
      },
      humidity: {
        min: Math.min(...hums),
        max: Math.max(...hums),
        avg: +(hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1)
      },
      soil_moisture: {
        min: Math.min(...soils),
        max: Math.max(...soils),
        avg: Math.round(soils.reduce((a, b) => a + b, 0) / soils.length)
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
