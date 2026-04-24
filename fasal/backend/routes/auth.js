import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (authError) return res.status(400).json({ error: authError.message });

    const userId = authData.user.id;
    const farmerId = `KAR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

    // Insert minimal profile
    const { error: profError } = await supabase.from('farmer_profiles').insert({
      user_id: userId, farmer_id: farmerId, name,
      district: 'Pending', soil_type: 'Pending', water_source: 'Pending'
    });
    if (profError) console.error('Profile insert error:', profError);

    // Sign in to get token
    const { data: session } = await supabase.auth.signInWithPassword({ email, password });

    res.json({
      user_id: userId,
      farmer_id: farmerId,
      token: session?.session?.access_token || null
    });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, farmer_id } = req.body;

    let loginEmail = email;
    if (!loginEmail && farmer_id) {
      // Lookup email from farmer_id
      const { data } = await supabase.from('farmer_profiles')
        .select('user_id').eq('farmer_id', farmer_id).single();
      if (!data) return res.status(404).json({ error: 'Farmer ID not found' });
      const { data: userData } = await supabase.auth.admin.getUserById(data.user_id);
      loginEmail = userData?.user?.email;
    }
    if (!loginEmail) return res.status(400).json({ error: 'email or farmer_id required' });

    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) return res.status(401).json({ error: error.message });

    const { data: profile } = await supabase.from('farmer_profiles')
      .select('*').eq('user_id', data.user.id).single();

    res.json({
      user_id: data.user.id,
      farmer_id: profile?.farmer_id,
      token: data.session.access_token,
      profile_complete: profile?.district !== 'Pending'
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
