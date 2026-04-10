'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'
import { ONBOARD_STEPS } from '@/lib/types'

export default function OnboardingScreen() {
  const { email, setScreen, setProfile, setAppData, setGenStep } = useAppStore()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

  const current = ONBOARD_STEPS[step]
  const val = answers[current.id]

  const handleSelect = (opt: string) => {
    setAnswers((prev) => ({ ...prev, [current.id]: opt }))
    if (current.type === 'select') {
      setTimeout(() => advance({ ...answers, [current.id]: opt }), 150)
    }
  }

  const handleMultiToggle = (opt: string) => {
    const cur = (answers[current.id] as string[]) || []
    setAnswers((prev) => ({
      ...prev,
      [current.id]: cur.includes(opt) ? cur.filter((v) => v !== opt) : [...cur, opt],
    }))
  }

  const advance = async (currentAnswers = answers) => {
    if (step < ONBOARD_STEPS.length - 1) {
      setStep((s) => s + 1)
      return
    }
    // Final step — save profile and trigger generation
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const profile = {
      user_id: user.id,
      email: email || user.email || '',
      name: (currentAnswers.name as string) || '',
      age: (currentAnswers.age as string) || '',
      sex: (currentAnswers.sex as string) || '',
      height: parseFloat(currentAnswers.height as string) || 0,
      weight: parseFloat(currentAnswers.weight as string) || 0,
      target_weight: parseFloat(currentAnswers.target_weight as string) || 0,
      goal: (currentAnswers.goal as string) || '',
      activity: (currentAnswers.activity as string) || '',
      exercise: (currentAnswers.exercise as string) || '',
      sleep: (currentAnswers.sleep as string) || '',
      diet: (currentAnswers.diet as string) || '',
      diet_issues: (currentAnswers.diet_issues as string[]) || [],
      avoid_foods: (currentAnswers.avoid_foods as string) || '',
      conditions: (currentAnswers.conditions as string[]) || [],
      location: (currentAnswers.location as string) || '',
      exercise_preference: (currentAnswers.exercise_preference as string) || '',
      daily_time: (currentAnswers.daily_time as string) || '',
      plan_style: (currentAnswers.plan_style as string) || '',
      onboarding_complete: true,
    }

    const appData = {
      user_id: user.id,
      phase: 1,
      start_weight: profile.weight,
      target_weight: profile.target_weight,
    }

    await Promise.all([
      supabase.from('profiles').upsert(profile, { onConflict: 'user_id' }),
      supabase.from('app_data').upsert(appData, { onConflict: 'user_id' }),
    ])

    setProfile(profile)
    setAppData(appData)
    setGenStep(0)
    setScreen('generating')
  }

  const handleSkip = () => {
    setAnswers((prev) => ({ ...prev, [current.id]: current.type === 'multiselect' ? [] : '' }))
    if (step < ONBOARD_STEPS.length - 1) setStep((s) => s + 1)
    else advance()
  }

  return (
    <div className="hc-onboard-screen">
      {/* Progress pips */}
      <div className="hc-onboard-progress">
        {ONBOARD_STEPS.map((_, i) => (
          <div
            key={i}
            className={`hc-onboard-pip${i < step ? ' done' : i === step ? ' current' : ''}`}
          />
        ))}
      </div>

      <div className="hc-onboard-card">
        <div className="hc-onboard-q">{current.question}</div>
        {current.subtitle && <div className="hc-onboard-sub">{current.subtitle}</div>}

        {current.type === 'select' && (
          <div className="hc-onboard-options">
            {current.options!.map((opt) => (
              <button
                key={opt}
                className={`hc-onboard-opt${val === opt ? ' selected' : ''}`}
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {current.type === 'multiselect' && (
          <>
            <div className="hc-onboard-options">
              {current.options!.map((opt) => (
                <button
                  key={opt}
                  className={`hc-onboard-opt${((val as string[]) || []).includes(opt) ? ' selected' : ''}`}
                  onClick={() => handleMultiToggle(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="hc-onboard-nav">
              {step > 0 && (
                <button className="hc-onboard-back" onClick={() => setStep((s) => s - 1)}>← Back</button>
              )}
              <button className="hc-auth-btn" style={{ flex: 1 }} onClick={() => advance()}>
                {step === ONBOARD_STEPS.length - 1 ? 'Build My Plan →' : 'Continue →'}
              </button>
            </div>
          </>
        )}

        {(current.type === 'text' || current.type === 'number') && (
          <>
            <input
              className="hc-auth-input"
              type={current.type}
              placeholder={current.placeholder}
              value={(val as string) || ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && advance()}
              autoFocus
            />
            <div className="hc-onboard-nav">
              {step > 0 && (
                <button className="hc-onboard-back" onClick={() => setStep((s) => s - 1)}>← Back</button>
              )}
              <button
                className="hc-auth-btn"
                style={{ flex: 1 }}
                onClick={() => advance()}
                disabled={!current.optional && !val}
              >
                {step === ONBOARD_STEPS.length - 1 ? 'Build My Plan →' : 'Continue →'}
              </button>
            </div>
          </>
        )}

        {current.optional && current.type !== 'multiselect' && (
          <div className="hc-skip-link" onClick={handleSkip}>Skip this question</div>
        )}
      </div>
    </div>
  )
}
