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
      `Create 4 health plan phases for: ${ps}\n\nJSON format: {"phases":[{"num":1,"name":"Phase Name","weeks":"Weeks 1-8","effort":"Low","pillars":[{"icon":"🚶","name":"Movement","text":"One sentence advice."},{"icon":"🥗","name":"Nutrition","text":"One sentence."},{"icon":"💧","name":"Hydration","text":"One sentence."},{"icon":"😴","name":"Sleep","text":"One sentence."}],"goal":"One sentence goal."}]}\nReturn exactly 4 phases with 4 pillars each. Keep all text under 20 words. Personalise to their profile.`
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
      `Create health plan overview for: ${ps}\n\nJSON: {"philosophy":{"title":"Title","paragraphs":["Paragraph 1","Paragraph 2"]},"scienceStats":[{"num":"66","label":"days to form habit"},{"num":"27%","label":"stat label"},{"num":"0.5kg","label":"weekly loss target"},{"num":"120g","label":"daily protein"}],"weeklyRhythm":{"days":[{"name":"Mon","icon":"🚶","activity":"Walk 30min","type":"walk"},{"name":"Tue","icon":"💪","activity":"Strength 20min","type":"strength"},{"name":"Wed","icon":"🚶","activity":"Walk","type":"walk"},{"name":"Thu","icon":"⚽","activity":"Sport/cardio","type":"sport"},{"name":"Fri","icon":"😌","activity":"Rest","type":"rest"},{"name":"Sat","icon":"💪","activity":"Strength","type":"strength"},{"name":"Sun","icon":"🌳","activity":"Rest","type":"rest"}]},"mindset":[{"title":"Keyword","text":"One sentence."}]}\nReturn 4 scienceStats, 7 days, 4 mindset items. Personalise.`
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
      `Create sleep tips, sport advice, and focus sections for: ${ps}\n\nJSON: {"sleepAdvice":{"intro":"One sentence about their sleep.","tips":["Tip 1","Tip 2","Tip 3","Tip 4"]},"sportAdvice":{"icon":"🏃","title":"Maximise Your Exercise","text":"Two sentences of advice."},"focusSections":[{"icon":"🍬","title":"Focus Area Title","intro":"One sentence.","steps":[{"week":"Wk 1-2","text":"Action step."},{"week":"Wk 3-4","text":"Action step."},{"week":"Wk 5-6","text":"Action step."}]}]}\nInclude 0-2 focusSections based on their diet issues. 4 sleep tips. Personalise.`
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
