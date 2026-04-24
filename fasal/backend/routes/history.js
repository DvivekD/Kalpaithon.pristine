import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// GET /api/history
router.get('/', async (req, res) => {
  try {
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('id').eq('user_id', req.userId).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const { data: history } = await supabase.from('season_history')
      .select('*').eq('profile_id', profile.id)
      .order('created_at', { ascending: false });

    // Compute summary stats
    const totalSeasons = history?.length || 0;
    let bestProfit = null, mostGrown = null, avgMargin = 0;
    if (totalSeasons > 0) {
      bestProfit = history.reduce((best, s) =>
        (s.net_profit || 0) > (best?.net_profit || -Infinity) ? s : best, null);
      const cropCounts = {};
      history.forEach(s => { cropCounts[s.crop] = (cropCounts[s.crop] || 0) + 1; });
      mostGrown = Object.entries(cropCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const totalMargin = history.reduce((s, h) => {
        if (h.gross_revenue > 0) return s + ((h.net_profit || 0) / h.gross_revenue);
        return s;
      }, 0);
      avgMargin = Math.round(totalMargin / totalSeasons * 100);
    }

    res.json({
      history: history || [],
      summary: {
        total_seasons: totalSeasons,
        best_profit_season: bestProfit?.season || null,
        best_profit_amount: bestProfit?.net_profit || 0,
        most_grown_crop: mostGrown,
        avg_profit_margin: avgMargin
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
