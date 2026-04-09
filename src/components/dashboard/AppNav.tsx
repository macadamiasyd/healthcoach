'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'
import { PHASES } from '@/lib/types'

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'log', label: 'Log' },
  { id: 'plan', label: 'My Plan' },
  { id: 'progress', label: 'Progress' },
  { id: 'settings', label: 'Settings' },
] as const

export default function AppNav() {
  const { page, setPage, profile, appData, email, reset, setScreen } = useAppStore()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = profile?.name || 'Me'
  const initials = displayName === 'Me' ? '👤' : displayName.slice(0, 2).toUpperCase()
  const phase = appData?.phase || 1
  const phaseInfo = PHASES[phase - 1]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExport = () => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const [{ data: p }, { data: a }, { data: f }, { data: ex }, { data: w }, { data: plans }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('app_data').select('*').eq('user_id', user.id).single(),
        supabase.from('food_logs').select('*').eq('user_id', user.id),
        supabase.from('exercise_logs').select('*').eq('user_id', user.id),
        supabase.from('weight_logs').select('*').eq('user_id', user.id),
        supabase.from('plans').select('plan_data, generated_at').eq('user_id', user.id).order('generated_at', { ascending: false }).limit(1),
      ])
      const blob = new Blob([JSON.stringify({ profile: p, appData: a, foodLogs: f, exerciseLogs: ex, weightLogs: w, plan: plans?.[0]?.plan_data }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a2 = document.createElement('a')
      a2.href = url
      a2.download = `health-coach-export-${new Date().toISOString().split('T')[0]}.json`
      a2.click()
      URL.revokeObjectURL(url)
    })
    setShowMenu(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    reset()
    setScreen('auth')
    setShowMenu(false)
  }

  return (
    <nav className="hc-app-nav">
      <div className="hc-app-logo">Health <em>Coach</em></div>

      <div className="hc-nav-tabs">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`hc-nav-tab${page === tab.id ? ' active' : ''}`}
            onClick={() => setPage(tab.id as typeof page)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="hc-nav-right">
        <div className="hc-phase-badge" onClick={() => setPage('settings')}>
          Phase <span>{phase}</span> · {phaseInfo.name.split(' ').slice(0, 2).join(' ')}
        </div>

        <div className="hc-user-badge" ref={menuRef} onClick={() => setShowMenu((v) => !v)}>
          {initials}
          {showMenu && (
            <div className="hc-user-menu">
              <div className="hc-user-menu-email">{email}</div>
              <button className="hc-user-menu-item" onClick={() => { setPage('profile'); setShowMenu(false) }}>My Profile</button>
              <button className="hc-user-menu-item" onClick={handleExport}>Export Data</button>
              <button className="hc-user-menu-item danger" onClick={handleSignOut}>Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
