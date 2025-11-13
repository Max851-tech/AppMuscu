import { useEffect, useMemo, useState } from 'react'

import Sidebar from './components/Sidebar'
import type { Exercise, Workout } from './types'
import { createUID } from './utils/id'
import { loadTheme, loadWorkouts, persistTheme, persistWorkouts, type ThemePreference } from './utils/storage'
import ProfileView from './views/ProfileView'
import StatsView from './views/StatsView'
import WorkoutsView from './views/WorkoutsView'

type Tab = 'workouts' | 'stats' | 'profile'

type WorkoutDraft = {
  id?: string
  name: string
  date: string
  focusArea?: string
  notes?: string
  exercises: Exercise[]
}

const STORAGE_FALLBACK: Workout[] = []

const seedWorkouts: Workout[] = [
  {
    id: createUID(),
    name: 'Push explosif',
    date: new Date().toISOString().slice(0, 10),
    focusArea: 'Pectoraux & triceps',
    notes: 'Très bonnes sensations, focus tempo lent à la descente.',
    exercises: [
      { id: createUID(), name: 'Développé couché barre', sets: 4, reps: 6, weight: 80 },
      { id: createUID(), name: 'Dips lestés', sets: 3, reps: 10, weight: 20 },
      { id: createUID(), name: 'Écarté poulie', sets: 3, reps: 15, weight: 18 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: createUID(),
    name: 'Leg Day solide',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    focusArea: 'Force & mobilité',
    notes: 'Squat profond, travail sur la stabilité.',
    exercises: [
      { id: createUID(), name: 'Back squat', sets: 5, reps: 5, weight: 105 },
      { id: createUID(), name: 'Soulevé de terre JT', sets: 4, reps: 8, weight: 80 },
      { id: createUID(), name: 'Fentes marchées', sets: 3, reps: 12, weight: 24 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workouts')
  const [theme, setTheme] = useState<ThemePreference>(() => (typeof window === 'undefined' ? 'light' : loadTheme('light')))
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    if (typeof window === 'undefined') return STORAGE_FALLBACK
    const stored = loadWorkouts<Workout[]>(STORAGE_FALLBACK)
    return stored.length > 0 ? stored : seedWorkouts
  })

  const sortedWorkouts = useMemo(
    () => workouts.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [workouts],
  )

  useEffect(() => {
    persistWorkouts(sortedWorkouts)
  }, [sortedWorkouts])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    persistTheme(theme)
  }, [theme])

  const handleSaveWorkout = (draft: WorkoutDraft) => {
    setWorkouts((prev) => {
      if (draft.id) {
        return prev.map((existing) =>
          existing.id === draft.id
            ? {
                ...existing,
                name: draft.name.trim(),
                date: draft.date,
                focusArea: draft.focusArea?.trim() || undefined,
                notes: draft.notes?.trim() || undefined,
                exercises: draft.exercises.map((exercise) => ({ ...exercise })),
                updatedAt: new Date().toISOString(),
              }
            : existing,
        )
      }

      const now = new Date().toISOString()
      const newWorkout: Workout = {
        id: createUID(),
        name: draft.name.trim(),
        date: draft.date,
        focusArea: draft.focusArea?.trim() || undefined,
        notes: draft.notes?.trim() || undefined,
        exercises: draft.exercises.map((exercise) => ({ ...exercise })),
        createdAt: now,
        updatedAt: now,
      }

      return [...prev, newWorkout]
    })
  }

  const handleDeleteWorkout = (id: string) => {
    setWorkouts((prev) => prev.filter((workout) => workout.id !== id))
  }

  const handleDuplicateWorkout = (id: string) => {
    setWorkouts((prev) => {
      const workout = prev.find((item) => item.id === id)
      if (!workout) return prev

      const now = new Date().toISOString()
      const duplicated: Workout = {
        ...workout,
        id: createUID(),
        name: `${workout.name} (copie)`,
        createdAt: now,
        updatedAt: now,
        date: new Date().toISOString().slice(0, 10),
        exercises: workout.exercises.map((exercise) => ({ ...exercise, id: createUID() })),
      }

      return [...prev, duplicated]
    })
  }

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-900 transition dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 lg:flex-row">
      <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} theme={theme} onToggleTheme={toggleTheme} />

      <main className="flex-1 overflow-y-auto px-6 py-10 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          {activeTab === 'workouts' && (
            <WorkoutsView
              workouts={sortedWorkouts}
              onSave={handleSaveWorkout}
              onDelete={handleDeleteWorkout}
              onDuplicate={handleDuplicateWorkout}
            />
          )}

          {activeTab === 'stats' && <StatsView workouts={sortedWorkouts} />}

          {activeTab === 'profile' && <ProfileView />}
        </div>
      </main>
    </div>
  )
}

