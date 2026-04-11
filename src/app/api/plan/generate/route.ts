import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const JSYS =
  'You are a JSON generator. Output ONLY a valid JSON object or array. No markdown, no backticks, no explanation, no text outside the JSON. Begin your response with { or [.'

// Called from plan-generator.ts (client-side) with a single prompt
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt, maxTokens } = await request.json()
  if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens || 1200,
    messages: [{ role: 'user', content: JSYS + '\n\n' + prompt }],
  })

  const raw = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  return NextResponse.json({ raw })
}
