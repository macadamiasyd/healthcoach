'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'
import { PHASES } from '@/lib/types'

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { id: 'log', label: 'Log', shortLabel: 'Log', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )},
  { id: 'plan', label: 'My Plan', shortLabel: 'Plan', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )},
  { id: 'progress', label: 'Progress', shortLabel: 'Progress', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )},
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )},
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
    <>
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

      {/* Mobile bottom nav */}
      <div className="hc-mobile-nav">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`hc-mobile-nav-tab${page === tab.id ? ' active' : ''}`}
            onClick={() => setPage(tab.id as typeof page)}
          >
            <span className="hc-mobile-nav-icon">{tab.icon}</span>
            <span className="hc-mobile-nav-label">{tab.shortLabel}</span>
          </button>
        ))}
      </div>
    </>
  )
}
