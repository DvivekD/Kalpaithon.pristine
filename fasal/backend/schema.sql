-- Run this in Supabase SQL Editor (supabase.com → SQL Editor → New Query)

CREATE TABLE IF NOT EXISTS farmer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  farmer_id text UNIQUE NOT NULL,
  name text NOT NULL,
  latitude float,
  longitude float,
  district text NOT NULL,
  state text DEFAULT 'Karnataka',
  soil_type text NOT NULL,
  water_source text NOT NULL,
  farm_size float,
  misc_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crop_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES farmer_profiles NOT NULL,
  season text NOT NULL,
  weather_snapshot jsonb,
  predictions jsonb NOT NULL,
  selected_crop text,
  selected_crop_id text,
  input_cost_per_acre float,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grow_timelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid REFERENCES crop_predictions,
  profile_id uuid REFERENCES farmer_profiles NOT NULL,
  crop text NOT NULL,
  planting_date date NOT NULL,
  weeks jsonb NOT NULL,
  harvest_window_week int NOT NULL,
  current_week int DEFAULT 1,
  status text DEFAULT 'growing',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sell_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id uuid REFERENCES grow_timelines,
  profile_id uuid REFERENCES farmer_profiles NOT NULL,
  quantity_kg float NOT NULL,
  score text NOT NULL,
  score_reason text,
  price_chart jsonb,
  mandi_data jsonb,
  buyer_data jsonb,
  gross_revenue float,
  transport_cost float,
  input_cost float,
  net_profit float,
  decided_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS season_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES farmer_profiles NOT NULL,
  season text NOT NULL,
  crop text NOT NULL,
  input_cost float,
  gross_revenue float,
  net_profit float,
  mandi_used text,
  sell_date date,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_history ENABLE ROW LEVEL SECURITY;

-- RLS policies: service role bypasses, users see own data
CREATE POLICY "Users see own profile" ON farmer_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own predictions" ON crop_predictions
  FOR ALL USING (profile_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users see own timelines" ON grow_timelines
  FOR ALL USING (profile_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users see own sell decisions" ON sell_decisions
  FOR ALL USING (profile_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users see own history" ON season_history
  FOR ALL USING (profile_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()));
