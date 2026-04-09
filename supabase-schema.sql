-- ═══════════════════════════════════════
-- HEALTH COACH — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════

-- Profiles table (stores onboarding answers)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  age TEXT,
  sex TEXT,
  height NUMERIC,
  weight NUMERIC,
  target_weight NUMERIC,
  goal TEXT,
  activity TEXT,
  exercise TEXT DEFAULT '',
  sleep TEXT,
  diet TEXT,
  diet_issues TEXT[] DEFAULT '{}',
  avoid_foods TEXT DEFAULT '',
  conditions TEXT[] DEFAULT '{}',
  location TEXT DEFAULT '',
  exercise_preference TEXT,
  daily_time TEXT,
  plan_style TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Health plans (AI-generated, stored as JSON)
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- App data (phase, weights, targets)
CREATE TABLE app_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phase INTEGER DEFAULT 1,
  start_weight NUMERIC,
  target_weight NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Food logs
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  breakfast TEXT DEFAULT '',
  lunch TEXT DEFAULT '',
  dinner TEXT DEFAULT '',
  snacks TEXT DEFAULT '',
  logged_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Exercise logs
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  steps INTEGER DEFAULT 0,
  exercise TEXT DEFAULT '',
  logged_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Weight logs
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Weekly summaries (AI-generated)
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  summary TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own data
CREATE POLICY "Users access own profile" ON profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own plans" ON plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own app_data" ON app_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own food_logs" ON food_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own exercise_logs" ON exercise_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own weight_logs" ON weight_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own weekly_summaries" ON weekly_summaries FOR ALL USING (auth.uid() = user_id);
