import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './lib/supabase.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import predictRoutes from './routes/predict.js';
import timelineRoutes from './routes/timeline.js';
import smsRoutes from './routes/sms.js';
import sellRoutes from './routes/sell.js';
import growRoutes from './routes/grow.js';
import historyRoutes from './routes/history.js';
import { getWeather } from './lib/weather.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin requests (mobile apps, curl) and any vercel.app frontend
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
      cb(null, true);
    } else {
      cb(null, true); // permissive for now
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.post('/test', (req, res) => res.json({ body: req.body }));

// Auth middleware — extracts user_id from Supabase JWT
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    req.userId = user.id;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Auth failed' });
  }
}

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/predict', authMiddleware, predictRoutes);
app.use('/api/timeline', authMiddleware, timelineRoutes);
app.use('/api/sms', authMiddleware, smsRoutes);
app.use('/api/sell', authMiddleware, sellRoutes);
app.use('/api/grow', authMiddleware, growRoutes);
app.use('/api/buyers', authMiddleware, (req, res, next) => {
  // Reuse sell route's buyers endpoint
  next();
});
app.use('/api/history', authMiddleware, historyRoutes);

// Weather (protected)
app.get('/api/weather/current', authMiddleware, async (req, res) => {
  try {
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('latitude, longitude').eq('user_id', req.userId).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const weather = await getWeather(profile.latitude, profile.longitude);
    res.json(weather);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Buyers (separate endpoint)
app.get('/api/buyers', authMiddleware, async (req, res) => {
  const { findBuyers } = await import('./lib/overpass.js');
  try {
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('latitude, longitude').eq('user_id', req.userId).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const buyers = await findBuyers(profile.latitude, profile.longitude);
    res.json({ buyers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🌱 Fasal API running on port ${PORT}`);
  });
}

export default app;
