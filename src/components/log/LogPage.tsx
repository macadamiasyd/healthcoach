'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function LogPage() {
  const { foodLogs, exerciseLogs, weightLogs, setFoodLogs, setExerciseLogs, setWeightLogs, setCoachMsg } = useAppStore()

  // Food form
  const existingFood = foodLogs?.find((l) => l.date === todayStr())
  const [foodDate, setFoodDate] = useState(todayStr())
  const [breakfast, setBreakfast] = useState(existingFood?.breakfast || '')
  const [lunch, setLunch] = useState(existingFood?.lunch || '')
  const [dinner, setDinner] = useState(existingFood?.dinner || '')
  const [snacks, setSnacks] = useState(existingFood?.snacks || '')
  const [foodLoading, setFoodLoading] = useState(false)

  // Exercise form
  const existingExercise = exerciseLogs?.find((l) => l.date === todayStr())
  const [exDate, setExDate] = useState(todayStr())
  const [steps, setSteps] = useState(existingExercise?.steps?.toString() || '')
  const [exercise, setExercise] = useState(existingExercise?.exercise || '')
  const [exLoading, setExLoading] = useState(false)

  // Weight form
  const [weight, setWeight] = useState('')
  const [weightLoading, setWeightLoading] = useState(false)

  const [toast, setToast] = useState('')
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const saveFood = async () => {
    setFoodLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setFoodLoading(false); return }

    const log = { user_id: user.id, date: foodDate, breakfast, lunch, dinner, snacks }
    const { data } = await supabase
      .from('food_logs')
      .upsert(log, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (data) {
      const updated = foodLogs ? foodLogs.filter((l) => l.date !== foodDate) : []
      setFoodLogs([data, ...updated].sort((a, b) => b.date.localeCompare(a.date)))
    }

    // Get AI feedback
    setCoachMsg({ text: 'Reviewing your food diary…', loading: true })
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodLog: log }),
      })
      const d = await res.json()
      setCoachMsg({ text: d.message || 'Logged!', loading: false })
    } catch {
      setCoachMsg({ text: 'Food diary saved.', loading: false })
    }

    showToast('Food diary saved')
    setFoodLoading(false)
  }

  const saveExercise = async () => {
    setExLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setExLoading(false); return }

    const log = { user_id: user.id, date: exDate, steps: parseInt(steps) || 0, exercise }
    const { data } = await supabase
      .from('exercise_logs')
      .upsert(log, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (data) {
      const updated = exerciseLogs ? exerciseLogs.filter((l) => l.date !== exDate) : []
      setExerciseLogs([data, ...updated].sort((a, b) => b.date.localeCompare(a.date)))
    }
    showToast('Exercise logged')
    setExLoading(false)
  }

  const saveWeight = async () => {
    if (!weight) return
    setWeightLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setWeightLoading(false); return }

    const today = todayStr()
    const log = { user_id: user.id, date: today, weight: parseFloat(weight) }
    const { data } = await supabase
      .from('weight_logs')
      .upsert(log, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (data) {
      const updated = weightLogs ? weightLogs.filter((l) => l.date !== today) : []
      setWeightLogs([data, ...updated].sort((a, b) => b.date.localeCompare(a.date)))
    }
    showToast('Weight logged')
    setWeight('')
    setWeightLoading(false)
  }

  return (
    <div className="hc-page-inner">
      {/* Food Diary */}
      <div className="hc-log-form">
        <h3>🍽️ Food Diary</h3>
        <div className="hc-form-row">
          <label className="hc-form-label">Date</label>
          <input type="date" className="hc-form-input" value={foodDate} onChange={(e) => setFoodDate(e.target.value)} />
        </div>
        <div className="hc-meal-row">
          <span className="hc-meal-tag">Breakfast</span>
          <textarea className="hc-form-input" rows={2} placeholder="e.g. Oats with banana and honey" value={breakfast} onChange={(e) => setBreakfast(e.target.value)} />
        </div>
        <div className="hc-meal-row">
          <span className="hc-meal-tag">Lunch</span>
          <textarea className="hc-form-input" rows={2} placeholder="e.g. Chicken salad wrap" value={lunch} onChange={(e) => setLunch(e.target.value)} />
        </div>
        <div className="hc-meal-row">
          <span className="hc-meal-tag">Dinner</span>
          <textarea className="hc-form-input" rows={2} placeholder="e.g. Salmon with roasted veg" value={dinner} onChange={(e) => setDinner(e.target.value)} />
        </div>
        <div className="hc-meal-row">
          <span className="hc-meal-tag">Snacks</span>
          <textarea className="hc-form-input" rows={1} placeholder="e.g. Apple, handful of cashews" value={snacks} onChange={(e) => setSnacks(e.target.value)} />
        </div>
        <button className="hc-submit-btn" onClick={saveFood} disabled={foodLoading}>
          {foodLoading ? 'Saving…' : 'Save & Get Feedback'}
        </button>
      </div>

      {/* Exercise */}
      <div className="hc-log-form">
        <h3>🏃 Exercise & Steps</h3>
        <div className="hc-form-grid">
          <div className="hc-form-row">
            <label className="hc-form-label">Date</label>
            <input type="date" className="hc-form-input" value={exDate} onChange={(e) => setExDate(e.target.value)} />
          </div>
          <div className="hc-form-row">
            <label className="hc-form-label">Steps</label>
            <input type="number" className="hc-form-input" placeholder="e.g. 8000" value={steps} onChange={(e) => setSteps(e.target.value)} />
          </div>
        </div>
        <div className="hc-form-row">
          <label className="hc-form-label">Exercise</label>
          <textarea className="hc-form-input" rows={2} placeholder="e.g. 30min walk, 20min strength session" value={exercise} onChange={(e) => setExercise(e.target.value)} />
        </div>
        <button className="hc-submit-btn" style={{ background: 'var(--sage)' }} onClick={saveExercise} disabled={exLoading}>
          {exLoading ? 'Saving…' : 'Save Exercise'}
        </button>
      </div>

      {/* Weight */}
      <div className="hc-weight-form">
        <h3>⚖️ Log Weight</h3>
        <div className="hc-weight-input-wrap">
          <div className="hc-form-row">
            <label className="hc-form-label">Weight (kg)</label>
            <input type="number" step="0.1" className="hc-form-input" placeholder="e.g. 84.5" value={weight} onChange={(e) => setWeight(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveWeight()} />
          </div>
          <button className="hc-weight-submit" onClick={saveWeight} disabled={weightLoading || !weight}>
            {weightLoading ? '…' : 'Log'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className={`hc-toast show`}>{toast}</div>}
    </div>
  )
}
