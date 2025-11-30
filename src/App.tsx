import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import Sidebar from './components/Sidebar'
import type { Workout } from './types'
import {
  createWorkout,
  deleteWorkout,
  fetchCurrentUser,
  fetchWorkouts,
  loginWithEmail,
  logout,
  registerWithEmail,
  updateWorkout,
  type LoginPayload,
  type RegisterPayload,
  type ApiUser,
} from './services/api'
import { loadTheme, persistTheme, type ThemePreference } from './utils/storage'
import ProfileView from './views/ProfileView'
import StatsView from './views/StatsView'
import { ForgotPasswordView } from './views/ForgotPasswordView'
import LoginView from './views/LoginView'
import { ResetPasswordView } from './views/ResetPasswordView'
import WorkoutsView from './views/WorkoutsView'

type Tab = 'workouts' | 'stats' | 'profile'

type WorkoutDraft = {
  id?: string
  name: string
  date: string
  focusArea?: string
  notes?: string
  exercises: Workout['exercises']
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workouts')
  const [theme, setTheme] = useState<ThemePreference>(() => (typeof window === 'undefined' ? 'light' : loadTheme('light')))
  const [user, setUser] = useState<ApiUser | null>(null)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)

  const sortedWorkouts = useMemo(
    () => workouts.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [workouts],
  )

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    persistTheme(theme)
  }, [theme])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setIsLoadingUser(true)
        const currentUser = await fetchCurrentUser()
        setUser(currentUser)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoadingUser(false)
      }
    }

    bootstrap()
  }, [])

  useEffect(() => {
    if (!user) {
      setWorkouts([])
      return
    }

    const load = async () => {
      try {
        setIsLoadingWorkouts(true)
        const data = await fetchWorkouts()
        setWorkouts(data)
      } catch (err) {
        console.error(err)
        setError("Impossible de charger tes séances. Réessaie plus tard.")
      } finally {
        setIsLoadingWorkouts(false)
      }
    }

    load()
  }, [user])

  const handleLogin = async (payload: LoginPayload) => {
    try {
      setIsAuthSubmitting(true)
      setAuthError(null)
      const loggedInUser = await loginWithEmail(payload)
      setUser(loggedInUser)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Identifiants invalides.'
      setAuthError(message)
      throw new Error(message)
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  const handleRegister = async (payload: RegisterPayload) => {
    try {
      setIsAuthSubmitting(true)
      setAuthError(null)
      const registeredUser = await registerWithEmail(payload)
      setUser(registeredUser)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Impossible de créer le compte, réessaie dans un instant.'
      setAuthError(message)
      throw new Error(message)
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  const handleSaveWorkout = async (draft: WorkoutDraft) => {
    if (!user) return
    const payload = {
      name: draft.name.trim(),
      date: draft.date,
      focusArea: draft.focusArea?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
      exercises: draft.exercises.map(({ id, name, sets }) => ({
        id: draft.id ? id : undefined,
        name: name.trim(),
        sets,
      })),
    }

    try {
      setIsMutating(true)
      setError(null)
      if (draft.id) {
        const updated = await updateWorkout(draft.id, payload)
        setWorkouts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      } else {
        const created = await createWorkout(payload)
        setWorkouts((prev) => [created, ...prev])
      }
    } catch (err) {
      console.error(err)
      setError("Impossible d'enregistrer la séance. Réessaie.")
    } finally {
      setIsMutating(false)
    }
  }

  const handleDeleteWorkout = async (id: string) => {
    try {
      setIsMutating(true)
      setError(null)
      await deleteWorkout(id)
      setWorkouts((prev) => prev.filter((workout) => workout.id !== id))
    } catch (err) {
      console.error(err)
      setError("Impossible de supprimer la séance. Réessaie.")
    } finally {
      setIsMutating(false)
    }
  }

  const handleDuplicateWorkout = async (id: string) => {
    const workout = workouts.find((item) => item.id === id)
    if (!workout) return

    const payload = {
      name: `${workout.name} (copie)`,
      date: todayISO(),
      focusArea: workout.focusArea,
      notes: workout.notes,
      exercises: workout.exercises.map(({ name, sets }) => ({
        name,
        sets,
      })),
    }

    try {
      setIsMutating(true)
      setError(null)
      const created = await createWorkout(payload)
      setWorkouts((prev) => [created, ...prev])
    } catch (err) {
      console.error(err)
      setError("Impossible de dupliquer la séance pour l'instant.")
    } finally {
      setIsMutating(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      setUser(null)
      setWorkouts([])
      setAuthError(null)
    }
  }

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  if (isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Chargement de ton espace...
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" />
          ) : (
            <LoginView
              theme={theme}
              onToggleTheme={toggleTheme}
              onLogin={handleLogin}
              onRegister={handleRegister}
              isSubmitting={isAuthSubmitting}
              errorMessage={authError}
            />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordView />} />
      <Route path="/reset-password" element={<ResetPasswordView />} />
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : (
            <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-900 transition dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 lg:flex-row">
              <Sidebar
                activeTab={activeTab}
                onChangeTab={setActiveTab}
                theme={theme}
                onToggleTheme={toggleTheme}
                user={user}
                onLogout={handleLogout}
              />

              <main className="flex-1 overflow-y-auto px-6 py-10 lg:px-10">
                <div className="mx-auto flex max-w-6xl flex-col gap-8">
                  {error && (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                      {error}
                    </div>
                  )}

                  {activeTab === 'workouts' && (
                    <WorkoutsView
                      workouts={sortedWorkouts}
                      onSave={handleSaveWorkout}
                      onDelete={handleDeleteWorkout}
                      onDuplicate={handleDuplicateWorkout}
                      isLoading={isLoadingWorkouts}
                      isMutating={isMutating}
                    />
                  )}

                  {activeTab === 'stats' && <StatsView workouts={sortedWorkouts} />}

                  {activeTab === 'profile' && <ProfileView />}
                </div>
              </main>
            </div>
          )
        }
      />
    </Routes>
  )
}

