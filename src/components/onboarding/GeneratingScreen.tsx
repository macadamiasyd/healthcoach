'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'
import { generateFullPlan } from '@/lib/plan-generator'

const GEN_STEPS = [
  'Designing your four phases',
  'Building overview & weekly schedule',
  'Creating focus areas & sleep tips',
  'Generating Phase 1 & 2 meals',
  'Generating Phase 3 & 4 meals',
  'Building your snack library',
  'Saving your plan',
]

export default function GeneratingScreen() {
  const { profile, genStep, setGenStep, setPlan, setScreen, setPage } = useAppStore()
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !profile) return
    started.current = true

    const run = async () => {
      try {
        const plan = await generateFullPlan(profile, (s) => setGenStep(s))
        setGenStep(7)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('plans').insert({ user_id: user.id, plan_data: plan })
        }

        setPlan(plan)
        setTimeout(() => {
          setPage('plan')
          setScreen('app')
        }, 600)
      } catch (err) {
        console.error('Plan generation failed:', err)
        // Enter app anyway — plan page has a regenerate button
        setTimeout(() => {
          setPage('plan')
          setScreen('app')
        }, 500)
      }
    }

    run()
  }, [profile])

  return (
    <div className="hc-gen-screen">
      <div className="hc-gen-spinner" />
      <div className="hc-gen-text">Crafting your personalised health plan…</div>
      <div className="hc-gen-sub">
        Claude is building your 4-phase programme, meal ideas, snack library, and coaching strategy.
      </div>

      <div className="hc-gen-steps">
        {GEN_STEPS.map((label, i) => {
          const stepNum = i + 1
          const isDone = genStep > stepNum
          const isActive = genStep === stepNum
          return (
            <div
              key={i}
              className={`hc-gen-step${isDone ? ' done' : isActive ? ' active' : ''}`}
            >
              <div className="hc-gen-step-dot" />
              {label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
