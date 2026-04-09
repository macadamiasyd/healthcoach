'use client'

import { useAppStore } from '@/stores/app-store'
import type { Profile } from '@/lib/types'

const PROFILE_FIELDS: [string, (p: Profile | null) => string][] = [
  ['Name', (p) => p?.name || '—'],
  ['Age range', (p) => p?.age || '—'],
  ['Biological sex', (p) => p?.sex || '—'],
  ['Height', (p) => p?.height ? `${p.height}cm` : '—'],
  ['Starting weight', (p) => p?.weight ? `${p.weight}kg` : '—'],
  ['Target weight', (p) => p?.target_weight ? `${p.target_weight}kg` : '—'],
  ['Goal', (p) => p?.goal || '—'],
  ['Activity level', (p) => p?.activity || '—'],
  ['Exercise / sport', (p) => p?.exercise || '—'],
  ['Sleep', (p) => p?.sleep || '—'],
  ['Diet quality', (p) => p?.diet || '—'],
  ['Diet challenges', (p) => p?.diet_issues?.join(', ') || '—'],
  ['Avoid foods', (p) => p?.avoid_foods || '—'],
  ['Health conditions', (p) => p?.conditions?.join(', ') || '—'],
  ['Location', (p) => p?.location || '—'],
  ['Exercise preference', (p) => p?.exercise_preference || '—'],
  ['Daily time', (p) => p?.daily_time || '—'],
  ['Plan style', (p) => p?.plan_style || '—'],
]

export default function ProfilePage() {
  const { profile } = useAppStore()

  return (
    <div className="hc-page-inner">
      <div className="hc-section-head">Your Health Profile</div>
      <div className="hc-profile-section">
        <h3>👤 {profile?.name || 'My'} Profile</h3>
        {PROFILE_FIELDS.map(([key, getValue]) => (
          <div className="hc-profile-row" key={key}>
            <span className="hc-profile-key">{key}</span>
            <span className="hc-profile-val">{getValue(profile)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
