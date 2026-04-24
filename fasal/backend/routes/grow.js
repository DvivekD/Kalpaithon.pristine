import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { getHarvestReadiness } from '../lib/satellite.js';

const router = Router();

// GET /api/grow/readiness
router.get('/readiness', async (req, res) => {
  try {
    // 1. Get user profile
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('*').eq('user_id', req.userId).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // 2. Get active timeline
    const { data: timeline } = await supabase.from('grow_timelines')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('status', 'growing')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!timeline) {
      return res.json({ 
        readiness_score: 0, 
        status: 'NO_ACTIVE_CROP', 
        explanation: 'No active growing timeline found.' 
      });
    }

    // 3. Compute readiness
    const readiness = await getHarvestReadiness(
      profile.latitude, 
      profile.longitude, 
      timeline.crop, 
      timeline.planting_date
    );

    // 4. Log readiness (non-blocking, skip if table doesn't exist)
    // harvest_readiness table not in schema - skipping DB save

    res.json(readiness);

  } catch (error) {
    console.error('Readiness route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
