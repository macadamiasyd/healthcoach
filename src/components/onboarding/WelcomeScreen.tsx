'use client'

import { useAppStore } from '@/stores/app-store'

export default function WelcomeScreen() {
  const { setScreen } = useAppStore()

  return (
    <div className="hc-welcome-screen">
      <div className="hc-welcome-inner">
        <div className="hc-welcome-hero">
          <div className="hc-welcome-logo">Health <em>Coach</em></div>
          <div className="hc-welcome-tagline">
            A personalised AI health plan built around your body,<br />your life, and your goals.
          </div>
        </div>

        {/* How it works */}
        <div className="hc-welcome-section">
          <h2><span className="ws-icon">⚙️</span>How This App Works</h2>
          <div className="hc-welcome-steps">
            {[
              { n: 1, title: 'Answer 18 questions', desc: 'About your body, lifestyle, diet, and goals. Takes about 3 minutes.' },
              { n: 2, title: 'AI builds your plan', desc: 'Claude generates a personalised 4-phase health plan with meals, exercise, and coaching.' },
              { n: 3, title: 'Log your days', desc: 'Track food, exercise, and weight. Your coach reads every entry.' },
              { n: 4, title: 'Get coached', desc: 'Ask your coach anything. Daily briefings. Meal feedback. Weekly reviews.' },
            ].map(({ n, title, desc }) => (
              <div className="hc-welcome-step" key={n}>
                <div className="ws-num">{n}</div>
                <div className="ws-content">
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence-based */}
        <div className="hc-welcome-section">
          <h2><span className="ws-icon">🔬</span>Evidence-Based Approach</h2>
          <p>Your plan is informed by research across nutrition, behaviour change, and exercise science.</p>
          <div className="hc-welcome-sources">
            {[
              'Hallberg et al. (2018) — low-carb dietary intervention for type 2 diabetes',
              'Lally et al. (2010) — habit formation takes 66 days on average',
              'Garber et al. (2011) — ACSM guidelines for exercise and weight management',
              'Sacks et al. (2009) — dietary protein and weight loss (NEJM)',
              'Walker (2017) — sleep and metabolic health (Why We Sleep)',
              'Estruch et al. (2018) — Mediterranean diet and cardiovascular outcomes (PREDIMED)',
              'Cappuccio et al. (2011) — sleep duration and obesity risk meta-analysis',
              'Church et al. (2011) — combined diet and exercise for weight management',
            ].map((s) => (
              <div className="hc-welcome-source" key={s}>{s}</div>
            ))}
          </div>
          <p style={{ marginTop: '0.8rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
            This app provides general wellness guidance, not medical advice. Consult a healthcare professional for diagnosed conditions.
          </p>
        </div>

        {/* What happens next */}
        <div className="hc-welcome-section">
          <h2><span className="ws-icon">📋</span>What Happens Next</h2>
          <div className="hc-welcome-steps">
            {[
              { n: 1, title: 'Body & basics', desc: 'Age, height, weight, goal, activity level.' },
              { n: 2, title: 'Lifestyle', desc: 'Sleep, diet quality, dietary challenges, foods to avoid.' },
              { n: 3, title: 'Context', desc: 'Health conditions, location, exercise preferences.' },
              { n: 4, title: 'Plan style', desc: 'How structured or flexible you want your plan to be.' },
            ].map(({ n, title, desc }) => (
              <div className="hc-welcome-step" key={n}>
                <div className="ws-num">{n}</div>
                <div className="ws-content">
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="hc-welcome-privacy">
          <h2>🔒 Your Data is Secure</h2>
          <div className="hc-privacy-items">
            {[
              { icon: '🔐', title: 'AES-256 encryption', desc: 'All data encrypted at rest and in transit.' },
              { icon: '🚫', title: 'Never used for AI training', desc: 'Your data is not shared with Anthropic or any third party.' },
              { icon: '📦', title: 'Data export anytime', desc: 'Download all your data as JSON at any time from Settings.' },
              { icon: '✉️', title: 'Passwordless login', desc: 'Magic link authentication — no passwords stored.' },
            ].map(({ icon, title, desc }) => (
              <div className="hc-privacy-item" key={title}>
                <span className="pi-icon">{icon}</span>
                <span><strong>{title}</strong> — {desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hc-welcome-cta">
          <button className="hc-auth-btn" style={{ maxWidth: 320 }} onClick={() => setScreen('onboarding')}>
            Let's Get Started →
          </button>
        </div>
      </div>
    </div>
  )
}
