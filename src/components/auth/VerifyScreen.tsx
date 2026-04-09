'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'

export default function VerifyScreen() {
  const { email, setScreen, setProfile, setAppData, setFoodLogs, setExerciseLogs, setWeightLogs, setPlan, setPage } = useAppStore()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const digitRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { digitRefs.current[0]?.focus() }, [])

  const handleDigitChange = (idx: number, val: string) => {
    if (val.length > 1) val = val.slice(-1)
    if (val && !/\d/.test(val)) return
    const nc = [...digits]
    nc[idx] = val
    setDigits(nc)
    if (val && idx < 5) digitRefs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      digitRefs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setDigits(paste.split(''))
      digitRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const token = digits.join('')
    if (token.length !== 6) { setMsg({ type: 'error', text: 'Enter the 6-digit code.' }); return }
    setLoading(true)
    setMsg(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error || !data.user) {
      setLoading(false)
      setMsg({ type: 'error', text: error?.message || 'Invalid or expired code.' })
      return
    }

    // Load profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', data.user.id).single()
    const { data: appData } = await supabase.from('app_data').select('*').eq('user_id', data.user.id).single()

    if (profile?.onboarding_complete) {
      // Returning user — load all data
      const [{ data: foodLogs }, { data: exerciseLogs }, { data: weightLogs }, { data: planRow }] = await Promise.all([
        supabase.from('food_logs').select('*').eq('user_id', data.user.id).order('date', { ascending: false }).limit(30),
        supabase.from('exercise_logs').select('*').eq('user_id', data.user.id).order('date', { ascending: false }).limit(30),
        supabase.from('weight_logs').select('*').eq('user_id', data.user.id).order('date', { ascending: false }).limit(30),
        supabase.from('plans').select('plan_data').eq('user_id', data.user.id).order('generated_at', { ascending: false }).limit(1).single(),
      ])
      setProfile(profile)
      setAppData(appData)
      setFoodLogs(foodLogs || [])
      setExerciseLogs(exerciseLogs || [])
      setWeightLogs(weightLogs || [])
      if (planRow?.plan_data) setPlan(planRow.plan_data)
      setLoading(false)
      setPage('dashboard')
      setScreen('app')
    } else {
      setLoading(false)
      setScreen('welcome')
    }
  }

  return (
    <div className="hc-auth-screen">
      <div className="hc-auth-card">
        <div className="hc-auth-logo">
          Health <em>Coach</em>
        </div>
        <div className="hc-auth-subtitle">Enter the 6-digit code from your email</div>

        <div className="hc-magic-digits" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { digitRefs.current[i] = el }}
              className="hc-magic-digit"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>

        <button className="hc-auth-btn" onClick={handleVerify} disabled={loading}>
          {loading ? 'Verifying…' : 'Verify & Sign In'}
        </button>

        {msg && <div className={`hc-auth-msg ${msg.type}`}>{msg.text}</div>}

        <span
          className="hc-auth-link"
          onClick={() => { setMsg(null); setScreen('auth') }}
        >
          ← Back to email
        </span>
      </div>
    </div>
  )
}
