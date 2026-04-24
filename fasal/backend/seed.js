import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function seed() {
  console.log('🌱 Seeding Fasal database...');

  // 1. Create demo user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'demo@fasal.app',
    password: 'demo1234',
    email_confirm: true
  });

  if (authError && !authError.message.includes('already')) {
    console.error('Auth error:', authError);
    return;
  }

  const userId = authData?.user?.id;
  if (!userId) {
    // Try to find existing user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find(u => u.email === 'demo@fasal.app');
    if (!existing) { console.error('Cannot find or create demo user'); return; }
    var resolvedUserId = existing.id;
  } else {
    var resolvedUserId = userId;
  }

  console.log('User ID:', resolvedUserId);

  // 2. Insert farmer profile
  const { data: profile, error: profErr } = await supabase.from('farmer_profiles').upsert({
    user_id: resolvedUserId,
    farmer_id: 'KAR-2024-00001',
    name: 'Ravi Kumar',
    latitude: 13.136,
    longitude: 78.129,
    district: 'Kolar',
    state: 'Karnataka',
    soil_type: 'Red Loamy',
    water_source: 'Rainfed',
    farm_size: 2.0
  }, { onConflict: 'farmer_id' }).select().single();

  if (profErr) { console.error('Profile error:', profErr); return; }
  console.log('Profile:', profile.farmer_id);

  // 3. Past season
  await supabase.from('season_history').insert({
    profile_id: profile.id,
    season: 'Kharif 2023',
    crop: 'Tomato',
    input_cost: 18000,
    gross_revenue: 22400,
    net_profit: 3200,
    mandi_used: 'Kolar APMC',
    sell_date: '2023-10-15'
  });
  console.log('Season history seeded');

  // 4. Active prediction
  const { data: prediction } = await supabase.from('crop_predictions').insert({
    profile_id: profile.id,
    season: 'Rabi 2024-25',
    predictions: {
      crops: [
        { name: 'Tomato', success_pct: 84, advisable: true, input_cost_per_acre: 14000 },
        { name: 'Ragi', success_pct: 78, advisable: true, input_cost_per_acre: 6500 },
        { name: 'Onion', success_pct: 71, advisable: true, input_cost_per_acre: 10000 }
      ],
      recommended: 'Tomato'
    },
    selected_crop: 'Tomato',
    input_cost_per_acre: 14000
  }).select().single();
  console.log('Prediction seeded');

  // 5. Active timeline (4 weeks in)
  const plantingDate = new Date();
  plantingDate.setDate(plantingDate.getDate() - 28); // 4 weeks ago

  await supabase.from('grow_timelines').insert({
    prediction_id: prediction?.id,
    profile_id: profile.id,
    crop: 'Tomato',
    planting_date: plantingDate.toISOString().split('T')[0],
    weeks: [
      { week: 1, title: 'Land prep & sowing', task: 'Prepare seedbed, sow at 2cm depth', detail: 'Apply basal fertiliser 50kg/acre', critical: false },
      { week: 2, title: 'Germination care', task: 'Maintain moisture, thin seedlings', detail: 'Remove weak seedlings', critical: false },
      { week: 3, title: 'First weeding', task: 'Remove weeds manually', detail: 'Apply neem cake around plants', critical: false },
      { week: 4, title: 'Fertiliser application', task: 'Apply 20kg DAP per acre', detail: 'Side-dress around plant base', critical: true },
      { week: 5, title: 'Staking', task: 'Stake plants with bamboo', detail: 'Tie loosely with jute string', critical: false },
      { week: 6, title: 'Pest monitoring', task: 'Check for aphids and mites', detail: 'Spray neem oil if found', critical: true },
      { week: 7, title: 'Flowering stage', task: 'Light irrigation daily', detail: 'Do not disturb flowers', critical: false },
      { week: 8, title: 'Fruit setting', task: 'Apply potash fertiliser', detail: '15kg MOP per acre', critical: false },
      { week: 9, title: 'Pre-harvest', task: 'Reduce irrigation', detail: 'Let fruits ripen on vine', critical: false },
      { week: 10, title: 'Harvest window', task: 'Pick when 70% show colour', detail: 'Early morning harvest best', critical: true }
    ],
    harvest_window_week: 10,
    current_week: 4,
    status: 'growing'
  });
  console.log('Timeline seeded (week 4 of 10)');

  console.log('\n✅ Seed complete!');
  console.log('Login: demo@fasal.app / demo1234');
  console.log('Farmer ID: KAR-2024-00001');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
