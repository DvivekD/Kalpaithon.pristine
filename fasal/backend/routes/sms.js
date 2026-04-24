import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import twilio from 'twilio';

const router = Router();

// Extracted from Kisaansaathi bot conversation
const TWILIO_SID = process.env.TWILIO_SID || 'dummy_sid';
const TWILIO_AUTH = process.env.TWILIO_AUTH || 'dummy_auth';
const TWILIO_FROM = process.env.TWILIO_FROM || '+17402848886';
const VERIFIED_TO = process.env.VERIFIED_TO || '+917892585383';

const client = twilio(TWILIO_SID, TWILIO_AUTH);

router.post('/demo-push', async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Get farmer profile
    const { data: profile } = await supabase.from('farmer_profiles')
      .select('*').eq('user_id', userId).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // 2. Get active timeline
    const { data: timeline } = await supabase.from('grow_timelines')
      .select('*').eq('profile_id', profile.id).eq('status', 'active').single();

    // 3. Compile message
    let message = `Fasal Demo Push 🌾\n\n`;
    
    if (timeline && timeline.timeline_json) {
      const parsed = typeof timeline.timeline_json === 'string' ? JSON.parse(timeline.timeline_json) : timeline.timeline_json;
      // Get current week task
      const plantDate = new Date(timeline.planting_date);
      const today = new Date();
      const diffTime = Math.abs(today - plantDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const currentWeekNum = Math.max(1, Math.ceil(diffDays / 7));
      
      const weeks = parsed.timeline || parsed;
      const currentWeekData = weeks.find(w => w.week === currentWeekNum) || weeks[0];
      
      message += `Crop: ${timeline.crop}\nWeek ${currentWeekNum}: ${currentWeekData.phase}\nAction: ${currentWeekData.action}\n\n`;
    } else {
      message += `Crop setup is incomplete. Complete your timeline to get tasks.\n\n`;
    }

    // Add mock market price
    const mockPrices = { 'Tomato': 1400, 'Rice': 2200, 'Wheat': 2100, 'Corn': 1800, 'Default': 1500 };
    const cropType = timeline ? timeline.crop : 'Tomato';
    const price = mockPrices[cropType] || mockPrices['Default'];
    message += `Live Market: ₹${price}/qtl (High Demand)\nPlan your harvest!`;

    // 4. Dispatch SMS
    const twilioRes = await client.messages.create({
      body: message,
      from: TWILIO_FROM,
      to: VERIFIED_TO
    });

    res.json({ success: true, messageId: twilioRes.sid });
  } catch (e) {
    console.error('Demo Push SMS Error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
