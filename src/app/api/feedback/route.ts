import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/plan-generator'
import type { Profile, FoodLog } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { foodLog } = (await request.json()) as { foodLog: FoodLog }
  if (!foodLog) return NextResponse.json({ error: 'Missing foodLog' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const p = profile as Profile
  const systemPrompt = buildSystemPrompt(p)

  const foodSummary = [
    foodLog.breakfast && `Breakfast: ${foodLog.breakfast}`,
    foodLog.lunch && `Lunch: ${foodLog.lunch}`,
    foodLog.dinner && `Dinner: ${foodLog.dinner}`,
    foodLog.snacks && `Snacks: ${foodLog.snacks}`,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `Food diary for ${foodLog.date}:\n${foodSummary || 'Nothing logged yet.'}\n\nGive brief feedback on this day's eating. 2-3 sentences: what was good, what to improve, one specific suggestion for tomorrow. Be direct and personalised.`

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: systemPrompt + '\n\n' + prompt }],
  })

  const message = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  return NextResponse.json({ message })
}
