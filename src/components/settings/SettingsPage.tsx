'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'
import { PHASES } from '@/lib/types'

export default function SettingsPage() {
  const { appData, setAppData, setFoodLogs, setExerciseLogs, setWeightLogs } = useAppStore()
  const [startWeight, setStartWeight] = useState(appData?.start_weight?.toString() || '')
  const [targetWeight, setTargetWeight] = useState(appData?.target_weight?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const setPhase = async (phase: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const updated = { ...(appData || { start_weight: 0, target_weight: 0 }), user_id: user.id, phase }
    await supabase.from('app_data').upsert(updated, { onConflict: 'user_id' })
    setAppData({ ...updated, phase })
    showToast(`Switched to Phase ${phase}`)
  }

  const saveWeights = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const updated = {
      ...(appData || { phase: 1 }),
      user_id: user.id,
      start_weight: parseFloat(startWeight) || appData?.start_weight || 0,
      target_weight: parseFloat(targetWeight) || appData?.target_weight || 0,
    }
    await supabase.from('app_data').upsert(updated, { onConflict: 'user_id' })
    setAppData(updated)
    setSaving(false)
    showToast('Weights saved')
  }

  const clearLogs = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await Promise.all([
      supabase.from('food_logs').delete().eq('user_id', user.id),
      supabase.from('exercise_logs').delete().eq('user_id', user.id),
      supabase.from('weight_logs').delete().eq('user_id', user.id),
    ])
    setFoodLogs([])
    setExerciseLogs([])
    setWeightLogs([])
    setShowClearConfirm(false)
    showToast('All logs cleared')
  }

  const currentPhase = appData?.phase || 1

  return (
    <div className="hc-page-inner">
      {/* Phase selector */}
      <div className="hc-section-head">Current Phase</div>
      <div className="hc-phase-select-grid">
        {PHASES.map((p) => (
          <div
            key={p.num}
            className={`hc-phase-option${currentPhase === p.num ? ' selected' : ''}`}
            onClick={() => setPhase(p.num)}
          >
            <div className="hc-phase-num-label">{p.num}</div>
            <div className="hc-phase-opt-name">{p.name}</div>
            <div className="hc-phase-opt-weeks">{p.weeks}</div>
          </div>
        ))}
      </div>

      {/* Weights */}
      <div className="hc-section-head">Starting & Target Weight</div>
      <div className="hc-log-form">
        <div className="hc-form-grid">
          <div className="hc-form-row">
            <label className="hc-form-label">Starting weight (kg)</label>
            <input type="number" step="0.1" className="hc-form-input" value={startWeight} onChange={(e) => setStartWeight(e.target.value)} />
          </div>
          <div className="hc-form-row">
            <label className="hc-form-label">Target weight (kg)</label>
            <input type="number" step="0.1" className="hc-form-input" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} />
          </div>
        </div>
        <button className="hc-submit-btn" onClick={saveWeights} disabled={saving}>
          {saving ? 'Saving…' : 'Save Weights'}
        </button>
      </div>

      {/* Clear logs */}
      <div className="hc-section-head" style={{ marginTop: '2rem' }}>Danger Zone</div>
      {!showClearConfirm ? (
        <button
          className="hc-submit-btn"
          style={{ background: 'var(--rust)', maxWidth: 260 }}
          onClick={() => setShowClearConfirm(true)}
        >
          Clear All Logs
        </button>
      ) : (
        <div className="hc-log-form">
          <p style={{ marginBottom: '1rem', color: 'var(--muted)', fontSize: '0.88rem' }}>
            This will permanently delete all food, exercise, and weight logs. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button className="hc-submit-btn" style={{ background: 'var(--rust)' }} onClick={clearLogs}>
              Yes, clear everything
            </button>
            <button className="hc-onboard-back" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {toast && <div className="hc-toast show">{toast}</div>}
    </div>
  )
}
