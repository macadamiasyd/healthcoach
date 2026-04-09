import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/plan-generator'
import type { Profile } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt } = await request.json()
  if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })

  // Load profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Load recent logs
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  const [{ data: foodLogs }, { data: exerciseLogs }, { data: weightLogs }, { data: appData }] =
    await Promise.all([
      supabase.from('food_logs').select('*').eq('user_id', user.id).gte('date', sevenDaysAgo).order('date', { ascending: false }).limit(3),
      supabase.from('exercise_logs').select('*').eq('user_id', user.id).gte('date', sevenDaysAgo).order('date', { ascending: false }).limit(5),
      supabase.from('weight_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(5),
      supabase.from('app_data').select('*').eq('user_id', user.id).single(),
    ])

  const p = profile as Profile
  const systemPrompt = buildSystemPrompt(p)

  const currentWeight = weightLogs?.length ? weightLogs[0].weight : p?.weight
  const startWeight = appData?.start_weight || p?.weight || 0
  const lost = startWeight - (currentWeight || 0)

  const recentFood = (foodLogs || [])
    .map((l: { date: string; breakfast: string; lunch: string; dinner: string; snacks?: string }) =>
      `${l.date}: B:${l.breakfast} L:${l.lunch} D:${l.dinner}${l.snacks ? ' +' + l.snacks : ''}`
    )
    .join('\n')

  const recentExercise = (exerciseLogs || [])
    .map((l: { date: string; steps?: number; exercise?: string }) =>
      `${l.date}: ${l.steps ? l.steps + ' steps' : ''} ${l.exercise || ''}`.trim()
    )
    .join('\n')

  const recentWeight = (weightLogs || [])
    .map((l: { date: string; weight: number }) => `${l.date}: ${l.weight}kg`)
    .join('\n')

  const phase = appData?.phase || 1
  const phaseNames = ['Build the Foundation', 'Layer in Strength', 'Dial in the Diet', 'Fine-Tune & Sustain']

  const context = `STATUS: Phase ${phase} (${phaseNames[phase - 1]}). Weight: ${currentWeight}kg (${lost > 0 ? 'lost ' + lost.toFixed(1) + 'kg' : lost < 0 ? 'gained ' + Math.abs(lost).toFixed(1) + 'kg' : 'unchanged'}). Target: ${appData?.target_weight || p?.target_weight}kg. Today: ${today}.
RECENT FOOD:\n${recentFood || 'None'}\nRECENT EXERCISE:\n${recentExercise || 'None'}\nRECENT WEIGHT:\n${recentWeight || 'None'}`

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{ role: 'user', content: systemPrompt + '\n\n' + context + '\n\nQuestion: ' + prompt }],
  })

  const message = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  return NextResponse.json({ message })
}
