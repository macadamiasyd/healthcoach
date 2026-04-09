import { create } from 'zustand'
import type { Profile, AppData, FoodLog, ExerciseLog, WeightLog, HealthPlan } from '@/lib/types'

export type AppScreen = 'loading' | 'auth' | 'verify' | 'welcome' | 'onboarding' | 'generating' | 'app'
export type AppPage = 'dashboard' | 'log' | 'plan' | 'progress' | 'settings' | 'profile'

interface AppState {
  screen: AppScreen
  page: AppPage
  email: string
  profile: Profile | null
  appData: AppData | null
  foodLogs: FoodLog[]
  exerciseLogs: ExerciseLog[]
  weightLogs: WeightLog[]
  plan: HealthPlan | null
  genStep: number
  coachMsg: { text: string; loading: boolean }

  setScreen: (s: AppScreen) => void
  setPage: (p: AppPage) => void
  setEmail: (e: string) => void
  setProfile: (p: Profile | null) => void
  setAppData: (d: AppData | null) => void
  setFoodLogs: (logs: FoodLog[]) => void
  setExerciseLogs: (logs: ExerciseLog[]) => void
  setWeightLogs: (logs: WeightLog[]) => void
  setPlan: (plan: HealthPlan | null) => void
  setGenStep: (s: number) => void
  setCoachMsg: (msg: { text: string; loading: boolean }) => void
  reset: () => void
}

const defaultState = {
  screen: 'loading' as AppScreen,
  page: 'dashboard' as AppPage,
  email: '',
  profile: null,
  appData: null,
  foodLogs: [],
  exerciseLogs: [],
  weightLogs: [],
  plan: null,
  genStep: 0,
  coachMsg: { text: 'Hit "Get My Briefing" for personalised feedback.', loading: false },
}

export const useAppStore = create<AppState>((set) => ({
  ...defaultState,
  setScreen: (screen) => set({ screen }),
  setPage: (page) => set({ page }),
  setEmail: (email) => set({ email }),
  setProfile: (profile) => set({ profile }),
  setAppData: (appData) => set({ appData }),
  setFoodLogs: (foodLogs) => set({ foodLogs }),
  setExerciseLogs: (exerciseLogs) => set({ exerciseLogs }),
  setWeightLogs: (weightLogs) => set({ weightLogs }),
  setPlan: (plan) => set({ plan }),
  setGenStep: (genStep) => set({ genStep }),
  setCoachMsg: (coachMsg) => set({ coachMsg }),
  reset: () => set(defaultState),
}))
