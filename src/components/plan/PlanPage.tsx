'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'
import { generateFullPlan } from '@/lib/plan-generator'
import type { HealthPlan, MealItem } from '@/lib/types'

const PHASE_COLORS = ['#7a9e7e', '#c9a84c', '#c4622d', '#5b7fa6']

function badgeClass(t: string) {
  return `hc-meal-badge hc-badge-${t || 'energy'}`
}

export default function PlanPage() {
  const { plan, profile, setPlan, setGenStep, setScreen, setPage } = useAppStore()
  const [activePhaseTab, setActivePhaseTab] = useState<Record<number, string>>({})
  const [regenerating, setRegenerating] = useState(false)

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const regeneratePlan = async () => {
    if (!profile) return
    setRegenerating(true)
    setGenStep(0)
    try {
      const newPlan = await generateFullPlan(profile, (s) => setGenStep(s))
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('plans').insert({ user_id: user.id, plan_data: newPlan })
      setPlan(newPlan)
    } catch (err) {
      console.error('Regeneration failed:', err)
    }
    setRegenerating(false)
  }

  if (!plan || (!plan.phases?.length && !plan.meals?.phases?.length && !plan.snacks?.length)) {
    return (
      <div className="hc-page-inner" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', marginBottom: '0.8rem' }}>
          {plan ? 'Plan Generation Had Issues' : 'Your Plan Needs Generating'}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
          {plan
            ? 'The AI wasn\'t able to generate your plan. Give it another go.'
            : 'Your personalised health plan will be created by AI. This takes about 45 seconds.'}
        </div>
        <button
          className="hc-submit-btn"
          style={{ maxWidth: 300, margin: '0 auto', display: 'block' }}
          onClick={regeneratePlan}
          disabled={regenerating}
        >
          {regenerating ? 'Generating…' : plan ? '↻ Try Again' : '✨ Generate My Health Plan'}
        </button>
      </div>
    )
  }

  // Build subnav dynamically
  const subnavItems: { id: string; label: string }[] = [{ id: 'psec-plan', label: '📋 The Plan' }]
  if (plan.focusSections?.length)
    plan.focusSections.forEach((f, i) =>
      subnavItems.push({ id: `psec-focus-${i}`, label: `${f.icon || '🎯'} ${f.title?.split(' ').slice(0, 2).join(' ') || 'Focus'}` })
    )
  subnavItems.push({ id: 'psec-weekly', label: '📅 Weekly' })
  if (plan.meals) subnavItems.push({ id: 'psec-meals', label: '🍽️ Meals' })
  if (plan.snacks?.length) subnavItems.push({ id: 'psec-snacks', label: '🍎 Snacks' })
  subnavItems.push({ id: 'psec-mindset', label: '🧠 Mindset' })

  const dayColors: Record<string, string> = {
    walk: '#e3f2fd',
    strength: '#fff3e0',
    sport: '#e8f5e9',
    rest: '#fafafa',
  }

  return (
    <div className="hc-plan-page-wrap">
      {/* Subnav */}
      <div className="hc-plan-subnav">
        {subnavItems.map((item) => (
          <button key={item.id} className="hc-plan-subnav-btn" onClick={() => scrollToSection(item.id)}>
            {item.label}
          </button>
        ))}
        <button
          className="hc-plan-subnav-btn"
          onClick={regeneratePlan}
          disabled={regenerating}
          style={{ marginLeft: 'auto', opacity: 0.7 }}
        >
          {regenerating ? '…' : '↻ Regenerate'}
        </button>
      </div>

      <div className="hc-plan-inner" id="psec-plan">
        {/* Philosophy */}
        {plan.philosophy && (
          <>
            <div className="hc-section-label">Your Health Philosophy</div>
            <div className="hc-philosophy">
              {plan.philosophy.title && <h2>{plan.philosophy.title}</h2>}
              {plan.philosophy.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </>
        )}

        {/* Science stats */}
        {plan.scienceStats?.length ? (
          <div className="hc-science-strip">
            {plan.scienceStats.map((s, i) => (
              <div className="hc-science-item" key={i}>
                <div className="hc-science-num">{s.num}</div>
                <div className="hc-science-label">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Phases */}
        {plan.phases?.length ? (
          <>
            <div className="hc-section-label" style={{ marginTop: '2rem' }}>Your 4-Phase Programme</div>
            <div className="hc-phases-intro">Your journey, <em>in phases</em></div>
            <div className="hc-phases-desc">Each phase builds on the last. Progress at your own pace.</div>
            {plan.phases.map((ph, i) => (
              <div className="hc-phase-card" key={i}>
                <div className="hc-phase-hdr" style={{ background: PHASE_COLORS[i] || '#888' }}>
                  <div className="hc-phase-hdr-num">{ph.num}</div>
                  <div>
                    <div className="hc-phase-hdr-label">Phase {ph.num} · {ph.effort}</div>
                    <div className="hc-phase-hdr-title">{ph.name}</div>
                  </div>
                  <div className="hc-phase-hdr-dur">{ph.weeks}</div>
                </div>
                <div className="hc-phase-body-inner">
                  <div className="hc-pillars">
                    {ph.pillars?.map((p, j) => (
                      <div className="hc-pillar" key={j}>
                        <div className="hc-pillar-icon">{p.icon}</div>
                        <div className="hc-pillar-name">{p.name}</div>
                        <div className="hc-pillar-text">{p.text}</div>
                      </div>
                    ))}
                  </div>
                  {ph.goal && (
                    <div className="hc-phase-goal-box">
                      <strong>Phase Goal:</strong> {ph.goal}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : null}

        <div className="hc-section-divider" />

        {/* Focus sections */}
        {plan.focusSections?.map((f, i) => (
          <div key={i} id={`psec-focus-${i}`}>
            <div className="hc-section-label">{f.icon} Focus Area</div>
            <div className="hc-focus-section">
              <h3>{f.title}</h3>
              <p>{f.intro}</p>
              <ul className="hc-focus-steps">
                {f.steps?.map((s, j) => (
                  <li key={j}>
                    <span className="hc-step-week">{s.week}</span>
                    <span>{s.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Sport advice */}
        {plan.sportAdvice && (
          <div className="hc-sport-callout">
            <div className="hc-sport-icon">{plan.sportAdvice.icon}</div>
            <div>
              <h3>{plan.sportAdvice.title}</h3>
              <p>{plan.sportAdvice.text}</p>
            </div>
          </div>
        )}

        {/* Weekly rhythm */}
        <div id="psec-weekly">
          <div className="hc-section-label">Weekly Rhythm</div>
          {plan.weeklyRhythm?.days?.length ? (
            <div className="hc-weekly-box">
              <h3>Your Weekly Blueprint</h3>
              <div className="hc-days-grid">
                {plan.weeklyRhythm.days.map((d, i) => (
                  <div
                    className="hc-day-cell"
                    key={i}
                    style={{ background: dayColors[d.type] || '#fafafa' }}
                  >
                    <div className="hc-day-name">{d.name}</div>
                    <div style={{ fontSize: '1rem', margin: '0.2rem 0' }}>{d.icon}</div>
                    <div className="hc-day-activity">{d.activity}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Sleep advice */}
        {plan.sleepAdvice && (
          <div className="hc-sleep-box">
            <h3>💤 Sleep Strategy</h3>
            <p>{plan.sleepAdvice.intro}</p>
            <div className="hc-sleep-tips">
              {plan.sleepAdvice.tips?.map((t, i) => (
                <div className="hc-sleep-tip" key={i}>{t}</div>
              ))}
            </div>
          </div>
        )}

        <div className="hc-section-divider" />

        {/* Meals */}
        {plan.meals && (
          <div id="psec-meals">
            <div className="hc-section-label">Meal Ideas</div>
            <div className="hc-meal-intro-box">
              <h2>Your Personalised Meals</h2>
              <p>{plan.meals.intro}</p>
              {plan.meals.avoidsList?.length > 0 && (
                <>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>Excluded from all meals:</p>
                  <div className="hc-avoids-strip">
                    {plan.meals.avoidsList.map((a, i) => <span className="hc-avoid-tag" key={i}>{a}</span>)}
                  </div>
                </>
              )}
            </div>

            {plan.meals.phases?.map((ph, i) => {
              const activeTab = (activePhaseTab[ph.phaseNum] || 'breakfast') as 'breakfast' | 'lunch' | 'dinner' | 'takeaway'
              const tabs = ['breakfast', 'lunch', 'dinner', 'takeaway'] as const
              const meals = ph[activeTab] as MealItem[]

              return (
                <div className="hc-meal-phase-card" key={i}>
                  <div className="hc-meal-phase-hdr" style={{ background: PHASE_COLORS[i] || '#888' }}>
                    <div>
                      <div className="hc-ph-label">Phase {ph.phaseNum}</div>
                      <div className="hc-ph-title">{ph.title}</div>
                    </div>
                    <div className="hc-ph-note">{ph.subtitle}</div>
                  </div>
                  <div className="hc-meal-phase-body">
                    <div className="hc-meal-tabs">
                      {tabs.map((t) => (
                        <button
                          key={t}
                          className={`hc-meal-tab-btn${activeTab === t ? ' active' : ''}`}
                          onClick={() => setActivePhaseTab((prev) => ({ ...prev, [ph.phaseNum]: t }))}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="hc-meal-panels">
                      <div className="hc-meal-grid">
                        {meals?.map((m, j) => (
                          <div className="hc-meal-card" key={j}>
                            <div className="hc-meal-num">#{j + 1}</div>
                            <div className="hc-meal-name">{m.name}</div>
                            <div className="hc-meal-desc">{m.desc}</div>
                            <span className={badgeClass(m.badgeType)}>{m.badge}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="hc-section-divider" />

        {/* Snacks */}
        {plan.snacks?.length ? (
          <div id="psec-snacks">
            <div className="hc-section-label">Snack Library</div>
            <div className="hc-snack-grid">
              {plan.snacks.map((s, i) => (
                <div className="hc-snack-card" key={i}>
                  <div className="hc-pillar-icon">{s.icon}</div>
                  <div className="hc-pillar-name">{s.name}</div>
                  <div className="hc-pillar-text">{s.desc}</div>
                  <span className={badgeClass(s.badgeType)}>{s.badge}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="hc-section-divider" />

        {/* Mindset */}
        {plan.mindset?.length ? (
          <div id="psec-mindset">
            <div className="hc-section-label">Mindset Framework</div>
            <div className="hc-mindset-box">
              <h3>Principles for the Long Game</h3>
              <div className="hc-mindset-items">
                {plan.mindset.map((m, i) => (
                  <div className="hc-mindset-item" key={i}>
                    <span className="hc-mi-head">{m.title}</span>
                    <span>{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
