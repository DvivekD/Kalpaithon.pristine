-- =============================================
-- Fasal IoT: sensor_readings table
-- Run this in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- =============================================

-- Create the sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL DEFAULT 'fasal-node-001',
  temperature REAL,
  humidity REAL,
  soil_moisture INTEGER,
  soil_raw INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast queries by device and time
CREATE INDEX idx_sensor_readings_device_time 
  ON sensor_readings (device_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (so the ESP32 can push data without auth)
CREATE POLICY "Allow anonymous insert" 
  ON sensor_readings 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Allow authenticated users to read all sensor data
CREATE POLICY "Allow authenticated read" 
  ON sensor_readings 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Also allow anonymous reads (so the dashboard works without login during dev)
CREATE POLICY "Allow anonymous read" 
  ON sensor_readings 
  FOR SELECT 
  TO anon 
  USING (true);
