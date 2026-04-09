'use client'

import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { PHASES } from '@/lib/types'

const QUICK_ACTIONS = [
  { label: 'Weight check', prompt: 'How am I tracking with my weight goal? Give me an honest assessment.' },
  { label: "This week's focus", prompt: "What should I focus on most this week based on my recent logs?" },
  { label: "Tonight's dinner", prompt: "Suggest a specific dinner for tonight that suits my phase and avoids my food restrictions." },
  { label: 'Smart snack', prompt: "Suggest the best snack for me right now based on my goals and restrictions." },
]

export default function Dashboard() {
  const { profile, appData, weightLogs, foodLogs, exerciseLogs, coachMsg, setCoachMsg, setPage } = useAppStore()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const displayName = profile?.name || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const phase = appData?.phase || 1
  const phaseInfo = PHASES[phase - 1]

  const currentWeight = weightLogs?.length ? weightLogs[0].weight : appData?.start_weight || profile?.weight || 0
  const startWeight = appData?.start_weight || profile?.weight || 0
  const lostSoFar = startWeight - currentWeight

  const todayStr = new Date().toISOString().split('T')[0]
  const todayExercise = exerciseLogs?.find((l) => l.date === todayStr)
  const stepsToday = todayExercise?.steps || 0

  // Days logged = number of unique dates with any log
  const allLogDates = new Set([
    ...(foodLogs || []).map((l) => l.date),
    ...(exerciseLogs || []).map((l) => l.date),
    ...(weightLogs || []).map((l) => l.date),
  ])
  const daysLogged = allLogDates.size

  // Streak — consecutive days logged ending today
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (allLogDates.has(ds)) streak++
    else if (i > 0) break
  }

  const callCoach = async (prompt: string, actionLabel?: string) => {
    setLoadingAction(actionLabel || 'briefing')
    setCoachMsg({ text: 'Thinking…', loading: true })
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      setCoachMsg({ text: data.message || 'No response.', loading: false })
    } catch {
      setCoachMsg({ text: 'Coach unavailable — check connection.', loading: false })
    }
    setLoadingAction(null)
  }

  const getBriefing = () =>
    callCoach(
      'Daily briefing: 1) How I\'m tracking 2) Something I did well 3) Focus for today 4) Weight trend. Max 5 sentences.'
    )

  // Recent entries (last 7 across all logs)
  type RecentEntry = { date: string; type: 'food' | 'exercise' | 'weight'; summary: string; icon: string }
  const recentEntries: RecentEntry[] = [
    ...(foodLogs || []).slice(0, 7).map((l) => ({
      date: l.date,
      type: 'food' as const,
      icon: '🍽️',
      summary: [l.breakfast, l.lunch, l.dinner].filter(Boolean).join(' · ').slice(0, 80) || 'Food logged',
    })),
    ...(exerciseLogs || []).slice(0, 7).map((l) => ({
      date: l.date,
      type: 'exercise' as const,
      icon: '🏃',
      summary: [l.steps ? `${l.steps} steps` : '', l.exercise].filter(Boolean).join(' · ') || 'Exercise logged',
    })),
    ...(weightLogs || []).slice(0, 7).map((l) => ({
      date: l.date,
      type: 'weight' as const,
      icon: '⚖️',
      summary: `${l.weight}kg`,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)

  const formatDate = (s: string) => {
    const d = new Date(s + 'T00:00:00')
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  }

  const stats = [
    { label: 'Current Weight', value: currentWeight ? `${currentWeight}kg` : '—', sub: `Target: ${appData?.target_weight || profile?.target_weight || '?'}kg`, color: '' },
    { label: 'Lost So Far', value: lostSoFar > 0 ? `${lostSoFar.toFixed(1)}kg` : lostSoFar < 0 ? `+${Math.abs(lostSoFar).toFixed(1)}kg` : '—', sub: lostSoFar > 0 ? 'Great progress' : '', color: lostSoFar > 0 ? 'good' : lostSoFar < 0 ? 'bad' : '' },
    { label: 'Steps Today', value: stepsToday ? stepsToday.toLocaleString() : '—', sub: `Target: ${phaseInfo.stepTarget.toLocaleString()}`, color: stepsToday >= phaseInfo.stepTarget ? 'good' : stepsToday > 0 ? 'warn' : '' },
    { label: 'Days Logged', value: String(daysLogged), sub: 'Total entries', color: '' },
    { label: 'Current Phase', value: `Phase ${phase}`, sub: phaseInfo.name, color: '' },
    { label: 'Streak', value: streak > 0 ? `${streak}d` : '—', sub: streak > 0 ? 'Keep it up!' : 'Start logging', color: streak >= 7 ? 'good' : streak > 0 ? 'warn' : '' },
  ]

  return (
    <div className="hc-page-inner">
      {/* Greeting */}
      <div className="hc-dash-greeting">
        <h1>
          {greeting}{displayName ? ', ' : ' '}<em>{displayName || 'ready to go'}</em>
        </h1>
        <p>{new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Stats */}
      <div className="hc-stat-grid">
        {stats.map((s) => (
          <div className="hc-stat-card" key={s.label}>
            <div className="hc-stat-label">{s.label}</div>
            <div className={`hc-stat-value${s.color ? ' ' + s.color : ''}`}>{s.value}</div>
            {s.sub && <div className="hc-stat-sub">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* AI Coach panel */}
      <div className="hc-coach-panel">
        <div className="hc-coach-header">
          <div className="hc-coach-avatar">🧠</div>
          <div>
            <div className="hc-coach-name">Your Health Coach</div>
            <div className="hc-coach-sub-text">Powered by Claude</div>
          </div>
        </div>
        <div className="hc-coach-body">
          <div className={`hc-coach-msg${coachMsg.loading ? ' loading' : ''}`}>
            {coachMsg.text}
          </div>
        </div>
        <div className="hc-coach-actions">
          <button
            className={`hc-coach-btn primary${loadingAction === 'briefing' ? ' loading' : ''}`}
            onClick={getBriefing}
            disabled={!!loadingAction}
          >
            {loadingAction === 'briefing' ? '…' : 'Get My Briefing'}
          </button>
          {QUICK_ACTIONS.map(({ label, prompt }) => (
            <button
              key={label}
              className="hc-coach-btn"
              onClick={() => callCoach(prompt, label)}
              disabled={!!loadingAction}
            >
              {loadingAction === label ? '…' : label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent entries */}
      <div>
        <div className="hc-section-head">Recent Activity</div>
        {recentEntries.length === 0 ? (
          <div className="hc-empty-state">
            <div className="big">📋</div>
            <div>No logs yet — start tracking to see your history here.</div>
            <button className="hc-auth-btn" style={{ maxWidth: 200, marginTop: '1rem' }} onClick={() => setPage('log')}>
              Log Something
            </button>
          </div>
        ) : (
          <div className="hc-log-list">
            {recentEntries.map((e, i) => (
              <div className="hc-log-item" key={i}>
                <div>
                  <div className="hc-log-item-date">{formatDate(e.date)}</div>
                  <div className="hc-log-item-text">{e.summary}</div>
                </div>
                <span style={{ fontSize: '1.2rem' }}>{e.icon}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
