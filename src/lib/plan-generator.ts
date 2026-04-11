import type { Profile, HealthPlan } from './types'

function profileStr(p: Profile): string {
  const bmi =
    p.height && p.weight
      ? (p.weight / Math.pow(p.height / 100, 2)).toFixed(1)
      : '?'
  return `${p.name || 'User'}, ${p.age || '?'}, ${p.sex || '?'}, ${p.height || '?'}cm, ${p.weight || '?'}kg BMI:${bmi}, target:${p.target_weight || '?'}kg. Goal:${p.goal || 'wellness'}. Activity:${p.activity || '?'}. Exercise:${p.exercise || 'none'}. Sleep:${p.sleep || '?'}. Diet:${p.diet || '?'}. Issues:${(p.diet_issues || []).join(',') || 'none'}. Avoids:${p.avoid_foods || 'none'}. Location:${p.location || '?'}. Preference:${p.exercise_preference || 'any'}. Time:${p.daily_time || '30min'}.`
}

function parseAIJson(raw: string): unknown {
  let s = (raw || '').trim()
  s = s.replace(/^```json?\s*/i, '').replace(/```\s*$/, '')
  const oi = s.indexOf('{')
  const ai = s.indexOf('[')
  let start = -1
  if (oi >= 0 && ai >= 0) start = Math.min(oi, ai)
  else if (oi >= 0) start = oi
  else if (ai >= 0) start = ai
  if (start < 0) throw new Error('No JSON found in: ' + s.substring(0, 100))
  const isArr = s[start] === '['
  const endChar = isArr ? ']' : '}'
  const ei = s.lastIndexOf(endChar)
  if (ei <= start) throw new Error('Incomplete JSON in: ' + s.substring(0, 100))
  return JSON.parse(s.substring(start, ei + 1))
}

async function safeGen(prompt: string, maxTokens?: number): Promise<unknown> {
  const res = await fetch('/api/plan/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const d = await res.json()
  return parseAIJson(d.raw)
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function generateFullPlan(
  profile: Profile,
  onStep?: (step: number) => void
): Promise<HealthPlan> {
  const ps = profileStr(profile)
  const errors: string[] = []

  // 1. Phases
  if (onStep) onStep(1)
  let phases: HealthPlan['phases'] = []
  try {
    const r = (await safeGen(
      `Create 4 personalised health plan phases for: ${ps}\n\nJSON format: {"phases":[{"num":1,"name":"Phase Name","weeks":"Weeks 1-8","effort":"Low","pillars":[{"icon":"🚶","name":"Movement","text":"2-3 substantive sentences of specific, actionable advice tailored to their lifestyle and location."},{"icon":"🥗","name":"Nutrition","text":"2-3 sentences of specific nutrition advice for their goal and diet issues."},{"icon":"💧","name":"Hydration","text":"2-3 sentences."},{"icon":"😴","name":"Sleep","text":"2-3 sentences specific to their current sleep hours and issues."}],"goal":"2 sentences describing specific, measurable outcomes for this phase."}]}\nReturn exactly 4 phases with 4 pillars each. Reference their specific exercise, location, food avoidances and goals. Make pillar text rich and substantive — not generic.`,
      2000
    )) as { phases: HealthPlan['phases'] }
    phases = r.phases || []
  } catch (e: unknown) {
    errors.push('phases: ' + (e instanceof Error ? e.message : String(e)))
  }

  // 2. Overview
  await wait(1500)
  if (onStep) onStep(2)
  let overview: Partial<HealthPlan> = {}
  try {
    const r = (await safeGen(
      `Create a rich health plan overview for: ${ps}\n\nJSON: {"philosophy":{"title":"The Science Behind This Plan","paragraphs":["3-4 sentences referencing their specific BMI, weight, height, location and the research supporting a gradual approach. Be specific — mention their actual stats.","3-4 sentences about their specific lifestyle assets (sport, location, activity) and what the evidence says about their particular situation."]},"scienceStats":[{"num":"~66","label":"Average days for a new habit to become automatic"},{"num":"0.5–1%","label":"Ideal weekly step increase to avoid drop-out"},{"num":"27%","label":"Reduced mortality risk with sustained moderate exercise"},{"num":"120–140g","label":"Daily protein target based on their weight and goals"}],"weeklyRhythm":{"days":[{"name":"Mon","icon":"🐕","activity":"Extended dog walk + mobility stretches","type":"walk"},{"name":"Tue","icon":"💪","activity":"20-min bodyweight strength","type":"strength"},{"name":"Wed","icon":"🐕","activity":"Dog walk + easy activity","type":"walk"},{"name":"Thu","icon":"⚽","activity":"Sport + warm-up and cool-down","type":"sport"},{"name":"Fri","icon":"😌","activity":"Light walk or full rest","type":"rest"},{"name":"Sat","icon":"💪","activity":"20-min strength session","type":"strength"},{"name":"Sun","icon":"🌳","activity":"Gentle walk or rest","type":"rest"}]},"mindset":[{"title":"Keyword","text":"2 sentences of specific mindset advice for their situation."}]}\nPersonalise the philosophy deeply to their stats. Return 4 scienceStats with real numbers relevant to their profile, 7 days personalised to their actual exercise routine, 4 mindset items.`,
      2000
    )) as Partial<HealthPlan>
    overview = r
  } catch (e: unknown) {
    errors.push('overview: ' + (e instanceof Error ? e.message : String(e)))
  }

  // 3. Sleep + Sport + Focus
  await wait(1500)
  if (onStep) onStep(3)
  let sleepAdvice: HealthPlan['sleepAdvice'] = undefined
  let sportAdvice: HealthPlan['sportAdvice'] = undefined
  let focusSections: HealthPlan['focusSections'] = []
  try {
    const r = (await safeGen(
      `Create detailed sleep tips, sport advice, and focus areas for: ${ps}\n\nJSON: {"sleepAdvice":{"intro":"2-3 sentences specifically about their current sleep (${profile.sleep}) and how improving it impacts their goal of ${profile.goal}. Reference their specific sleep hours.","tips":["Specific tip 1","Specific tip 2","Specific tip 3","Tip referencing their location/lifestyle","Tip about alcohol if relevant","Final tip"]},"sportAdvice":{"icon":"⚽","title":"Maximise Your Exercise Sessions","text":"4-5 sentences of rich, specific advice about their actual sport/exercise (${profile.exercise}). Include warm-up, recovery, what NOT to do, and how it fits the plan. Reference their age/location."},"focusSections":[{"icon":"🍬","title":"Focus Area Title","intro":"2 sentences explaining why this is their biggest opportunity.","steps":[{"week":"Weeks 1–2","text":"Specific action step."},{"week":"Weeks 3–4","text":"Specific action step."},{"week":"Weeks 5–6","text":"Specific action step."},{"week":"Weeks 7–8","text":"Specific action step."},{"week":"Weeks 9–12","text":"Specific action step."},{"week":"Ongoing","text":"Long-term approach."}]}]}\nInclude 1-2 focusSections based on their biggest diet issues: ${(profile.diet_issues || []).join(', ')}. Each focusSection should have 6 steps. 6 sleep tips. Make sport advice rich and specific to their actual activities.`,
      2000
    )) as { sleepAdvice: HealthPlan['sleepAdvice']; sportAdvice: HealthPlan['sportAdvice']; focusSections: HealthPlan['focusSections'] }
    sleepAdvice = r.sleepAdvice
    sportAdvice = r.sportAdvice
    focusSections = r.focusSections || []
  } catch (e: unknown) {
    errors.push('advice: ' + (e instanceof Error ? e.message : String(e)))
  }

  async function genMealsForPhase(
    num: number,
    title: string,
    subtitle: string,
    focus: string,
    retries = 1
  ) {
    const m: import('./types').MealPhase = { phaseNum: num, title, subtitle, breakfast: [], lunch: [], dinner: [], takeaway: [] }
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) await wait(2000)
        const r = (await safeGen(
          `${focus} meals phase ${num} for: ${ps}\nExclude: ${profile.avoid_foods || 'nothing'}. In ${profile.location || 'their area'}.\n{"b":[{"n":"Meal Name","d":"Brief tip","g":"Badge","t":"protein"}],"l":[same format],"di":[same format],"tk":[same format]}\nExactly 6 per array (b,l,di,tk). t values: protein|energy|light|quick|mediterranean. d: max 8 words.`,
          2000
        )) as { b?: unknown[]; l?: unknown[]; di?: unknown[]; tk?: unknown[] }
        const map = (arr: unknown[] = []) =>
          arr.map((x: unknown) => {
            const item = x as Record<string, string>
            return {
              name: item.n || item.name || '',
              desc: item.d || item.desc || '',
              badge: item.g || item.badge || '',
              badgeType: (item.t || item.badgeType || 'energy') as 'protein' | 'energy' | 'light' | 'quick' | 'comfort' | 'mediterranean',
            }
          })
        m.breakfast = map(r.b)
        m.lunch = map(r.l)
        m.dinner = map(r.di)
        m.takeaway = map(r.tk)
        if (m.breakfast.length > 0) break
      } catch (e: unknown) {
        if (attempt === retries)
          errors.push(`meals${num}: ` + (e instanceof Error ? e.message : String(e)))
      }
    }
    return m
  }

  // 4. Phase 1 & 2 meals
  await wait(2000)
  if (onStep) onStep(4)
  const meals1 = await genMealsForPhase(1, 'Simple & Familiar', 'Weeks 1–8', 'Simple easy')
  await wait(1500)
  const meals2 = await genMealsForPhase(2, 'Protein & Strength', 'Weeks 8–18', 'High protein')

  // 5. Phase 3 & 4 meals
  if (onStep) onStep(5)
  await wait(1500)
  const meals3 = await genMealsForPhase(3, 'Optimised Nutrition', 'Weeks 18–28', 'Mediterranean')
  await wait(1500)
  const meals4 = await genMealsForPhase(4, 'Sustain & Explore', 'Month 7+', 'Varied seasonal')

  // 6. Snacks
  if (onStep) onStep(6)
  await wait(1500)
  let snacks: HealthPlan['snacks'] = []
  try {
    const sn = await safeGen(
      `8 snacks for: ${ps}\nExclude: ${profile.avoid_foods || 'nothing'}.\n[{"i":"emoji","n":"Name","d":"5 words","g":"Tag","t":"protein"}]\nt: protein|energy|light`
    )
    const arr = Array.isArray(sn) ? sn : ((sn as Record<string, unknown>).snacks as unknown[] || [])
    snacks = arr.map((x: unknown) => {
      const item = x as Record<string, string>
      return {
        icon: item.i || item.icon || '🍎',
        name: item.n || item.name || '',
        desc: item.d || item.desc || '',
        badge: item.g || item.badge || '',
        badgeType: (item.t || item.badgeType || 'energy') as 'protein' | 'energy' | 'light' | 'quick' | 'comfort' | 'mediterranean',
      }
    })
  } catch (e: unknown) {
    errors.push('snacks: ' + (e instanceof Error ? e.message : String(e)))
  }

  if (errors.length) console.warn('Plan generation partial errors:', errors)

  const avoidsList = (profile.avoid_foods || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    ...(overview || {}),
    phases,
    focusSections,
    sleepAdvice,
    sportAdvice,
    meals: {
      intro: `Meal ideas personalised for ${profile.name || 'you'}, tailored to each phase. All meals exclude your avoided foods and feature options in ${profile.location || 'your area'}.`,
      avoidsList,
      phases: [meals1, meals2, meals3, meals4],
    },
    snacks,
    _errors: errors.length ? errors : undefined,
  }
}

export function buildSystemPrompt(profile: Profile): string {
  const name = profile.name || 'this person'
  const avoids = profile.avoid_foods || 'none listed'
  const issues = (profile.diet_issues || []).join(', ') || 'none'
  return `You are a personal health coach for ${name}. Everything you know:
PROFILE: ${profile.sex || 'Not specified'}, age ${profile.age || 'unknown'}, ${profile.height || '?'}cm, starting weight ${profile.weight || '?'}kg, target ~${profile.target_weight || '?'}kg. Location: ${profile.location || 'unknown'}. Activity: ${profile.activity || 'unknown'}. Exercise: ${profile.exercise || 'none'}. Sleep: ${profile.sleep || 'unknown'}. Diet: ${profile.diet || 'unknown'}. Issues: ${issues}. Goal: ${profile.goal || 'general wellness'}.
AVOIDED FOODS: ${avoids}.
PLAN PHASES: Phase 1 (Wk1-8): Foundation. Phase 2 (Wk8-18): Strength. Phase 3 (Wk18-28): Diet optimisation. Phase 4 (Month 7+): Sustain.
TONE: Direct when slacking, warm when doing well. Honest mate who knows their stuff. Concise. Never preachy.`
}
