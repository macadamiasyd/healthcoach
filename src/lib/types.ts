export interface Profile {
  id?: string
  user_id?: string
  email: string
  name: string
  age: string
  sex: string
  height: number
  weight: number
  target_weight: number
  goal: string
  activity: string
  exercise: string
  sleep: string
  diet: string
  diet_issues: string[]
  avoid_foods: string
  conditions: string[]
  location: string
  exercise_preference: string
  daily_time: string
  plan_style: string
  onboarding_complete: boolean
  created_at?: string
  updated_at?: string
}

export interface AppData {
  id?: string
  user_id?: string
  phase: number
  start_weight: number
  target_weight: number
}

export interface FoodLog {
  id?: string
  user_id?: string
  date: string
  breakfast: string
  lunch: string
  dinner: string
  snacks: string
  logged_at?: string
}

export interface ExerciseLog {
  id?: string
  user_id?: string
  date: string
  steps: number
  exercise: string
  logged_at?: string
}

export interface WeightLog {
  id?: string
  user_id?: string
  date: string
  weight: number
  logged_at?: string
}

export interface WeeklySummary {
  id?: string
  user_id?: string
  week_start: string
  summary: string
  generated_at?: string
}

export interface MealItem {
  name: string
  desc: string
  badge: string
  badgeType: 'protein' | 'energy' | 'light' | 'quick' | 'comfort' | 'mediterranean'
}

export interface MealPhase {
  phaseNum: number
  title: string
  subtitle: string
  breakfast: MealItem[]
  lunch: MealItem[]
  dinner: MealItem[]
  takeaway: MealItem[]
}

export interface HealthPlan {
  philosophy?: { title: string; paragraphs: string[] }
  scienceStats?: { num: string; label: string }[]
  phases?: {
    num: number
    name: string
    weeks: string
    effort: string
    pillars: { icon: string; name: string; text: string }[]
    goal: string
  }[]
  focusSections?: {
    icon: string
    title: string
    intro: string
    steps: { week: string; text: string }[]
  }[]
  sportAdvice?: { icon: string; title: string; text: string }
  sleepAdvice?: { intro: string; tips: string[] }
  weeklyRhythm?: {
    days: { name: string; icon: string; activity: string; type: 'walk' | 'strength' | 'sport' | 'rest' }[]
  }
  mindset?: { title: string; text: string }[]
  meals?: {
    intro: string
    avoidsList: string[]
    phases: MealPhase[]
  }
  snacks?: {
    icon: string
    name: string
    desc: string
    badge: string
    badgeType: 'protein' | 'energy' | 'light' | 'quick' | 'comfort' | 'mediterranean'
  }[]
  _errors?: string[]
}

export const PHASES = [
  { num: 1, name: 'Build the Foundation', weeks: 'Weeks 1–8', color: '#7a9e7e', stepTarget: 7000, desc: 'Build daily anchors and small swaps.' },
  { num: 2, name: 'Layer in Strength', weeks: 'Weeks 8–18', color: '#c9a84c', stepTarget: 8000, desc: 'Add resistance training and protein focus.' },
  { num: 3, name: 'Dial in the Diet', weeks: 'Weeks 18–28', color: '#c4622d', stepTarget: 9000, desc: 'Optimise nutrition, manage triggers.' },
  { num: 4, name: 'Fine-Tune & Sustain', weeks: 'Month 7+', color: '#5b7fa6', stepTarget: 10000, desc: 'Variety, intuitive eating, lifelong habits.' },
]

export const ONBOARD_STEPS = [
  { id: 'name', question: "What's your first name?", subtitle: "Optional — we'll use 'My' if you skip.", type: 'text', placeholder: 'e.g. Joel', optional: true },
  { id: 'age', question: "What's your age range?", type: 'select', options: ['18–25', '26–35', '36–45', '46–55', '56–65', '65+'] },
  { id: 'sex', question: "What's your biological sex?", subtitle: 'Helps calibrate baseline recommendations.', type: 'select', options: ['Male', 'Female', 'Prefer not to say'] },
  { id: 'height', question: 'How tall are you? (cm)', type: 'number', placeholder: 'e.g. 175' },
  { id: 'weight', question: "What's your current weight? (kg)", type: 'number', placeholder: 'e.g. 85' },
  { id: 'target_weight', question: "What's your target weight? (kg)", subtitle: "A realistic goal you'd be happy reaching.", type: 'number', placeholder: 'e.g. 78' },
  { id: 'goal', question: "What's your primary health goal?", type: 'select', options: ['Lose weight', 'Build muscle', 'Improve energy', 'Better sleep', 'Reduce stress', 'Manage a condition', 'General wellness'] },
  { id: 'activity', question: 'How active are you currently?', type: 'select', options: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'] },
  { id: 'exercise', question: 'What exercise or sport do you do?', subtitle: 'List anything — walks, gym, team sport, yoga.', type: 'text', placeholder: 'e.g. Walk daily, gym 2x week', optional: true },
  { id: 'sleep', question: 'How many hours of sleep do you get?', type: 'select', options: ['Less than 5', '5–6 hours', '6–7 hours', '7–8 hours', '8+ hours'] },
  { id: 'diet', question: 'How would you rate your current diet?', type: 'select', options: ['Poor', 'Fair', 'Good', 'Excellent'] },
  { id: 'diet_issues', question: 'Any specific dietary challenges?', subtitle: 'Be honest — helps your coach target advice.', type: 'multiselect', options: ['Too much sugar', 'Too much alcohol', 'Irregular meals', 'Too many takeaways', 'Not enough protein', 'Not enough vegetables', 'Late-night eating', 'None of these'] },
  { id: 'avoid_foods', question: 'Any foods you avoid or are allergic to?', subtitle: 'Your meal plan will exclude these.', type: 'text', placeholder: 'e.g. nuts, dairy, eggplant', optional: true },
  { id: 'conditions', question: 'Any diagnosed health conditions?', subtitle: 'Optional — flags relevant considerations.', type: 'multiselect', options: ['Diabetes', 'Heart disease', 'Hypertension', 'Asthma', 'Anxiety/Depression', 'Back/joint issues', 'None', 'Prefer not to say'], optional: true },
  { id: 'location', question: 'Where do you live?', subtitle: 'Helps suggest local food and activities.', type: 'text', placeholder: 'e.g. Melbourne, Australia' },
  { id: 'exercise_preference', question: 'Where do you prefer exercising?', type: 'select', options: ['At home', 'At the gym', 'Outdoors', 'Mix of all'] },
  { id: 'daily_time', question: 'How much time per day for health?', type: 'select', options: ['15 minutes', '30 minutes', '45 minutes', '60+ minutes'] },
  { id: 'plan_style', question: 'Structured plans or flexible guidance?', type: 'select', options: ['Structured — tell me what to do', 'Flexible — give me guidelines', 'Mix of both'] },
]
