'use client'

import { useAppStore } from '@/stores/app-store'

const formatDate = (s: string) => {
  const d = new Date(s + 'T00:00:00')
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function ProgressPage() {
  const { foodLogs, exerciseLogs, weightLogs } = useAppStore()

  type Entry = { date: string; type: string; icon: string; summary: string }

  const entries: Entry[] = [
    ...(foodLogs || []).map((l) => ({
      date: l.date,
      type: 'Food',
      icon: '🍽️',
      summary: [
        l.breakfast && `B: ${l.breakfast}`,
        l.lunch && `L: ${l.lunch}`,
        l.dinner && `D: ${l.dinner}`,
        l.snacks && `S: ${l.snacks}`,
      ].filter(Boolean).join('  ·  '),
    })),
    ...(exerciseLogs || []).map((l) => ({
      date: l.date,
      type: 'Exercise',
      icon: '🏃',
      summary: [l.steps ? `${l.steps.toLocaleString()} steps` : '', l.exercise].filter(Boolean).join(' · '),
    })),
    ...(weightLogs || []).map((l) => ({
      date: l.date,
      type: 'Weight',
      icon: '⚖️',
      summary: `${l.weight}kg`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="hc-page-inner">
      <div className="hc-section-head">Activity Log</div>

      {entries.length === 0 ? (
        <div className="hc-empty-state">
          <div className="big">📋</div>
          <div>No logs yet. Start tracking on the Log page.</div>
        </div>
      ) : (
        <div className="hc-log-list">
          {entries.map((e, i) => (
            <div className="hc-log-item" key={i}>
              <div style={{ flex: 1 }}>
                <div className="hc-log-item-date">{formatDate(e.date)} · {e.type}</div>
                <div className="hc-log-item-text" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {e.summary || '—'}
                </div>
              </div>
              <span style={{ fontSize: '1.3rem', marginLeft: '0.8rem' }}>{e.icon}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
