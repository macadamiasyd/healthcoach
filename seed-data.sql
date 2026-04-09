-- ═══════════════════════════════════════════════════════════
-- HEALTH COACH — SEED DATA
-- Run AFTER both users have signed in via magic link at least once
-- (so auth.users records exist)
-- ═══════════════════════════════════════════════════════════

-- Joel Baldwin
INSERT INTO profiles (user_id, email, name, age, sex, height, weight, target_weight, goal, activity, exercise, sleep, diet, diet_issues, avoid_foods, conditions, location, exercise_preference, daily_time, plan_style, onboarding_complete)
SELECT
  id,
  'baldwin.joel@gmail.com',
  'Joel',
  '46–55',
  'Male',
  187,
  95,
  87,
  'Lose weight',
  'Lightly active',
  'Community soccer regularly, walks the dog daily',
  '6–7 hours',
  'Fair',
  ARRAY['Too much sugar', 'Too much alcohol'],
  'eggplant, blue cheese, goat cheese, most nuts (cashews and pistachios OK), raisins, olives, feta, cottage cheese, hard-boiled eggs, peanut butter, ricotta, almond butter, almonds, paneer',
  ARRAY['None'],
  'Sydney, Australia',
  'Outdoors',
  '30 minutes',
  'Mix of both',
  true
FROM auth.users WHERE email = 'baldwin.joel@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO app_data (user_id, phase, start_weight, target_weight)
SELECT id, 1, 95, 87
FROM auth.users WHERE email = 'baldwin.joel@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Finlay Baldwin
INSERT INTO profiles (user_id, email, name, age, sex, height, weight, target_weight, goal, activity, exercise, sleep, diet, diet_issues, avoid_foods, conditions, location, exercise_preference, daily_time, plan_style, onboarding_complete)
SELECT
  id,
  'finlaybaldwin2@gmail.com',
  'Finlay',
  '18–25',
  'Male',
  180,
  75,
  73,
  'Build muscle',
  'Moderately active',
  'Gym 3x week, casual basketball',
  '7–8 hours',
  'Fair',
  ARRAY['Not enough protein', 'Too many takeaways'],
  '',
  ARRAY['None'],
  'Sydney, Australia',
  'At the gym',
  '45 minutes',
  'Structured — tell me what to do',
  true
FROM auth.users WHERE email = 'finlaybaldwin2@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO app_data (user_id, phase, start_weight, target_weight)
SELECT id, 1, 75, 73
FROM auth.users WHERE email = 'finlaybaldwin2@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
