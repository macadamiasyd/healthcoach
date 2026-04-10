'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'

export default function LoginScreen() {
  const { email, setEmail, setScreen } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSend = async () => {
    if (!email || !email.includes('@')) {
      setMsg({ type: 'error', text: 'Enter a valid email.' })
      return
    }
    setLoading(true)
    setMsg(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    setLoading(false)
    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ type: 'success', text: 'Check your email for a magic link or 6-digit code.' })
      setScreen('verify')
    }
  }

  return (
    <div className="hc-auth-screen">
      <div className="hc-auth-card">
        <div className="hc-auth-logo">
          Health <em>Coach</em>
        </div>
        <div className="hc-auth-subtitle">Your personalised AI health plan</div>

        <input
          className="hc-auth-input"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          autoFocus
        />

        <button className="hc-auth-btn" onClick={handleSend} disabled={loading}>
          {loading ? 'Sending…' : 'Send Magic Link'}
        </button>

        {msg && (
          <div className={`hc-auth-msg ${msg.type}`}>{msg.text}</div>
        )}

        <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.6 }}>
          We&apos;ll email you a magic link to sign in — no password needed.
        </div>
      </div>
    </div>
  )
}
