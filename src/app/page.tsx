'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'

import LoginScreen from '@/components/auth/LoginScreen'
import VerifyScreen from '@/components/auth/VerifyScreen'
import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import OnboardingScreen from '@/components/onboarding/OnboardingScreen'
import GeneratingScreen from '@/components/onboarding/GeneratingScreen'
import AppNav from '@/components/dashboard/AppNav'
import Dashboard from '@/components/dashboard/Dashboard'
import LogPage from '@/components/log/LogPage'
import PlanPage from '@/components/plan/PlanPage'
import ProgressPage from '@/components/progress/ProgressPage'
import SettingsPage from '@/components/settings/SettingsPage'
import ProfilePage from '@/components/profile/ProfilePage'

export default function Home() {
  const {
    screen, page,
    setScreen, setEmail, setProfile, setAppData,
    setFoodLogs, setExerciseLogs, setWeightLogs, setPlan,
  } = useAppStore()

  // On mount: check for existing Supabase session
  useEffect(() => {
    const supabase = createClient()

    const loadUserData = async (userId: string, userEmail: string) => {
      const [
        { data: profile },
        { data: appData },
        { data: foodLogs },
        { data: exerciseLogs },
        { data: weightLogs },
        { data: planRow },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('app_data').select('*').eq('user_id', userId).single(),
        supabase.from('food_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(60),
        supabase.from('exercise_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(60),
        supabase.from('weight_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(60),
        supabase.from('plans').select('plan_data').eq('user_id', userId).order('generated_at', { ascending: false }).limit(1).single(),
      ])

      setEmail(userEmail)

      if (profile?.onboarding_complete) {
        setProfile(profile)
        setAppData(appData)
        setFoodLogs(foodLogs || [])
        setExerciseLogs(exerciseLogs || [])
        setWeightLogs(weightLogs || [])
        if (planRow?.plan_data) setPlan(planRow.plan_data)
        setScreen('app')
      } else if (profile) {
        setProfile(profile)
        setScreen('welcome')
      } else {
        setScreen('welcome')
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id, session.user.email || '')
      } else {
        setScreen('auth')
      }
    })

    // Listen for auth changes (e.g. magic link callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && screen === 'auth') {
        loadUserData(session.user.id, session.user.email || '')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Loading state
  if (screen === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f' }}>
        <div className="hc-gen-spinner" />
      </div>
    )
  }

  if (screen === 'auth') return <LoginScreen />
  if (screen === 'verify') return <VerifyScreen />
  if (screen === 'welcome') return <WelcomeScreen />
  if (screen === 'onboarding') return <OnboardingScreen />
  if (screen === 'generating') return <GeneratingScreen />

  // App shell
  return (
    <div>
      <AppNav />
      {page === 'dashboard' && <Dashboard />}
      {page === 'log' && <LogPage />}
      {page === 'plan' && <PlanPage />}
      {page === 'progress' && <ProgressPage />}
      {page === 'settings' && <SettingsPage />}
      {page === 'profile' && <ProfilePage />}
    </div>
  )
}
