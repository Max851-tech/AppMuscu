import { Fragment, useMemo, useState } from 'react'

import type { Exercise, ExerciseSet, Routine, Workout } from '../types'
import { createUID } from '../utils/id'

type WorkoutDraft = {
  id?: string
  name: string
  date: string
  focusArea?: string
  notes?: string
  exercises: Exercise[]
}

type WorkoutsViewProps = {
  workouts: Workout[]
  routines: Routine[]
  onSave: (draft: WorkoutDraft) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDuplicate: (id: string) => Promise<void>
  isLoading: boolean
  isMutating: boolean
}

const emptySet = (): ExerciseSet => ({
  id: createUID(),
  reps: 10,
  weight: 20,
})

const emptyExercise = (): Exercise => ({
  id: createUID(),
  name: '',
  sets: [emptySet()],
})

const newDraft = (): WorkoutDraft => ({
  name: '',
  date: new Date().toISOString().slice(0, 10),
  focusArea: '',
  notes: '',
  exercises: [emptyExercise()],
})

const intensityBadge = (volume: number) => {
  if (volume > 20000) return { label: 'Monstrueux', tone: 'bg-rose-500/10 text-rose-500', emoji: '🔥' }
  if (volume > 12000) return { label: 'Solide', tone: 'bg-emerald-500/10 text-emerald-500', emoji: '🚀' }
  if (volume > 6000) return { label: 'Constante', tone: 'bg-cyan-500/10 text-cyan-500', emoji: '📈' }
  return { label: 'Légère', tone: 'bg-slate-500/10 text-slate-500', emoji: '🌱' }
}

const calculateVolume = (exercises: Exercise[]) =>
  exercises.reduce(
    (acc, exercise) =>
      acc + exercise.sets.reduce((setAcc, set) => setAcc + set.reps * set.weight, 0),
    0,
  )

type StartMode = 'pick' | 'blank' | 'routine'

export default function WorkoutsView({ workouts, routines, onSave, onDelete, onDuplicate, isLoading, isMutating }: WorkoutsViewProps) {
  const [draft, setDraft] = useState<WorkoutDraft>(newDraft)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startMode, setStartMode] = useState<StartMode>('pick')

  const sortedWorkouts = useMemo(
    () =>
      [...workouts].sort((a, b) => new Date(b.date ?? b.createdAt).getTime() - new Date(a.date ?? a.createdAt).getTime()),
    [workouts],
  )

  const handleSelectWorkout = (workout: Workout) => {
    setSelectedId(workout.id)
    setDraft({
      id: workout.id,
      name: workout.name,
      date: workout.date.slice(0, 10),
      focusArea: workout.focusArea ?? '',
      notes: workout.notes ?? '',
      exercises: workout.exercises.map((exercise) => ({ ...exercise })),
    })
    setIsDirty(false)
  }

  const handleReset = () => {
    setSelectedId(null)
    setDraft(newDraft)
    setIsDirty(false)
    setStartMode('pick')
  }

  const handleSelectRoutine = (routine: Routine) => {
    setDraft({
      name: routine.name,
      date: new Date().toISOString().slice(0, 10),
      focusArea: routine.focusArea ?? '',
      notes: '',
      exercises: routine.exercises.map((e) => ({
        id: createUID(),
        name: e.name,
        sets: e.sets.map((s) => ({ id: createUID(), reps: s.reps, weight: s.weight, rpe: s.rpe ?? undefined, notes: s.notes ?? undefined })),
      })),
    })
    setIsDirty(false)
    setStartMode('blank')
  }

  const updateExercise = (exerciseId: string, partial: Partial<Exercise>) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...partial } : exercise,
      ),
    }))
    setIsDirty(true)
  }

  const addExercise = () => {
    setDraft((prev) => ({
      ...prev,
      exercises: [...prev.exercises, emptyExercise()],
    }))
    setIsDirty(true)
  }

  const removeExercise = (exerciseId: string) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((exercise) => exercise.id !== exerciseId),
    }))
    setIsDirty(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim()) return
    if (draft.exercises.length === 0) return

    const cleanedExercises = draft.exercises.filter((exercise) => exercise.name.trim())
    if (cleanedExercises.length === 0) return

    try {
      setIsSubmitting(true)
      await onSave({
        ...draft,
        exercises: cleanedExercises.map((exercise) => ({
          ...exercise,
          sets: exercise.sets.map((set) => ({
            ...set,
            reps: Number.isFinite(set.reps) ? set.reps : 0,
            weight: Number.isFinite(set.weight) ? set.weight : 0,
            rpe: set.rpe && Number.isFinite(set.rpe) ? set.rpe : undefined,
          })),
        })),
      })

      if (!draft.id) {
        handleReset()
      } else {
        setIsDirty(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Mon planning</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">
            Séances & programmation
            <span className="ml-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
              {workouts.length} séance{workouts.length > 1 ? 's' : ''}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-600 dark:bg-amber-500/20 dark:text-amber-200">
              Modifications non sauvegardées
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-700"
          >
            Nouvelle séance
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {sortedWorkouts.length === 0 && (
              <div className="glass-card col-span-full border-dashed border-slate-300 bg-slate-50/40 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                {isLoading ? (
                  <p className="text-sm">Chargement de tes séances...</p>
                ) : (
                  <>
                    <p className="text-lg font-medium">Aucune séance enregistrée pour l’instant.</p>
                    <p className="mt-2 text-sm">Crée ta première routine à droite et suis ta progression.</p>
                  </>
                )}
              </div>
            )}

            {!isLoading &&
              sortedWorkouts.map((workout) => {
                const volume = calculateVolume(workout.exercises)
                const badge = intensityBadge(volume)
                const isActive = selectedId === workout.id

                return (
                  <article
                    key={workout.id}
                    onClick={() => handleSelectWorkout(workout)}
                    className={`glass-card flex cursor-pointer flex-col gap-4 border px-4 py-5 transition-all ${isActive ? 'ring-2 ring-emerald-400/60' : 'hover:ring-1 hover:ring-emerald-200/60'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-left text-lg font-semibold text-slate-900 transition hover:text-emerald-600 dark:text-white dark:hover:text-emerald-300">
                          {workout.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(workout.date ?? workout.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {workout.focusArea ? ` • ${workout.focusArea}` : ''}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.tone}`}>
                        {badge.emoji} {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto text-sm text-slate-500 dark:text-slate-400">
                      {workout.exercises.slice(0, 3).map((exercise) => (
                        <span key={exercise.id} className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/60">
                          {exercise.name}
                        </span>
                      ))}
                      {workout.exercises.length > 3 && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/60">
                          +{workout.exercises.length - 3} autres
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span>
                        Volume total{' '}
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{volume.toLocaleString('fr-FR')} kg</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void onDuplicate(workout.id)
                          }}
                          disabled={isMutating}
                          className="rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-900/60 dark:hover:text-white"
                        >
                          Dupliquer
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void onDelete(workout.id)
                          }}
                          disabled={isMutating}
                          className="rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 dark:border-transparent dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
          </div >
        </section >

        <section className="glass-card border px-6 py-6">
          {!draft.id && startMode === 'pick' && (
            <div className="flex h-full flex-col gap-6">
              <header>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Nouvelle séance</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Comment tu veux démarrer ?</h2>
              </header>

              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={() => setStartMode('blank')}
                  className="group flex flex-col items-start gap-2 rounded-2xl border-2 border-slate-200 bg-white/70 p-5 text-left transition hover:border-emerald-400/60 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-emerald-500/50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-emerald-500/20 dark:group-hover:text-emerald-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Entraînement à vide</p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Séance libre, tu construis au fil de l'eau.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStartMode('routine')}
                  className="group flex flex-col items-start gap-2 rounded-2xl border-2 border-slate-200 bg-white/70 p-5 text-left transition hover:border-emerald-400/60 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-emerald-500/50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-emerald-500/20 dark:group-hover:text-emerald-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <path d="M8 12h8M8 8h8M8 16h5" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Depuis une routine</p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {routines.length === 0 ? 'Crée d\'abord une routine dans l\'onglet Routines.' : `${routines.length} routine${routines.length > 1 ? 's' : ''} disponible${routines.length > 1 ? 's' : ''} — exercices pré-remplis.`}
                    </p>
                  </div>
                </button>
              </div>

              {startMode === 'pick' && false && null}
            </div>
          )}

          {!draft.id && startMode === 'routine' && (
            <div className="flex flex-col gap-6">
              <header className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStartMode('pick')}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Depuis une routine</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Choisis ton template</h2>
                </div>
              </header>

              {routines.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Aucune routine. Crée-en une dans l'onglet <strong>Routines</strong> d'abord.
                </p>
              ) : (
                <div className="space-y-3">
                  {routines.map((routine) => (
                    <button
                      key={routine.id}
                      type="button"
                      onClick={() => handleSelectRoutine(routine)}
                      className="group flex w-full flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white/70 p-4 text-left transition hover:border-emerald-400/60 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-emerald-500/50"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-300">
                          {routine.name}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {routine.exercises.length} exo{routine.exercises.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      {routine.focusArea && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">{routine.focusArea}</span>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {routine.exercises.slice(0, 4).map((e) => (
                          <span key={e.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {e.name}
                          </span>
                        ))}
                        {routine.exercises.length > 4 && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
                            +{routine.exercises.length - 4}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(draft.id || startMode === 'blank') && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <header className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {draft.id ? 'Modifier la séance' : 'Nouvelle séance'}
              </p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {draft.id ? 'Mets à jour ta séance' : 'Compose ton entraînement'}
              </h2>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Nom de la séance</span>
                <input
                  required
                  name="name"
                  value={draft.name}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, name: event.target.value }))
                    setIsDirty(true)
                  }}
                  placeholder="Push, Legs, Full body..."
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Date</span>
                <input
                  required
                  type="date"
                  name="date"
                  value={draft.date}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, date: event.target.value }))
                    setIsDirty(true)
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Focus / objectif</span>
                <input
                  name="focusArea"
                  value={draft.focusArea}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, focusArea: event.target.value }))
                    setIsDirty(true)
                  }}
                  placeholder="Hypertrophie poitrine, mobilité, explosivité..."
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Notes / sensations</span>
                <textarea
                  name="notes"
                  value={draft.notes}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, notes: event.target.value }))
                    setIsDirty(true)
                  }}
                  rows={3}
                  placeholder="Ajoute un ressenti, des ajustements à prévoir..."
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Exercices</h3>
                <button
                  type="button"
                  onClick={addExercise}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-[1px]"
                >
                  Ajouter un exercice
                </button>
              </div>

              <div className="space-y-3">
                {draft.exercises.map((exercise, index) => (
                  <Fragment key={exercise.id}>
                    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm transition dark:border-slate-800/60 dark:bg-slate-900/70">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-1 flex-col gap-3">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Nom de l’exercice
                            <input
                              required
                              value={exercise.name}
                              onChange={(event) => updateExercise(exercise.id, { name: event.target.value })}
                              placeholder="Développé couché, squat, rowing..."
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                            />
                          </label>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Séries
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  updateExercise(exercise.id, {
                                    sets: [...exercise.sets, emptySet()],
                                  })
                                }}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                              >
                                + Ajouter une série
                              </button>
                            </div>

                            <div className="space-y-2">
                              {exercise.sets.map((set, setIndex) => (
                                <div key={set.id} className="flex items-center gap-3">
                                  <span className="w-6 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                                    {setIndex + 1}
                                  </span>
                                  <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_minmax(0,1.5fr)]">
                                    <label className="relative">
                                      <input
                                        type="number"
                                        min={0}
                                        value={set.reps}
                                        onChange={(e) => {
                                          const newSets = [...exercise.sets]
                                          newSets[setIndex] = { ...set, reps: Number(e.target.value) }
                                          updateExercise(exercise.id, { sets: newSets })
                                        }}
                                        className="w-full rounded-lg border border-slate-200 bg-white/50 px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                                        placeholder="Reps"
                                      />
                                      <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-slate-400">
                                        reps
                                      </span>
                                    </label>
                                    <label className="relative">
                                      <input
                                        type="number"
                                        min={0}
                                        value={set.weight}
                                        onChange={(e) => {
                                          const newSets = [...exercise.sets]
                                          newSets[setIndex] = { ...set, weight: Number(e.target.value) }
                                          updateExercise(exercise.id, { sets: newSets })
                                        }}
                                        className="w-full rounded-lg border border-slate-200 bg-white/50 px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                                        placeholder="kg"
                                      />
                                      <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-slate-400">
                                        kg
                                      </span>
                                    </label>
                                    <label className="relative hidden sm:block">
                                      <input
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={set.rpe ?? ''}
                                        onChange={(e) => {
                                          const newSets = [...exercise.sets]
                                          newSets[setIndex] = {
                                            ...set,
                                            rpe: e.target.value ? Number(e.target.value) : undefined,
                                          }
                                          updateExercise(exercise.id, { sets: newSets })
                                        }}
                                        className="w-full rounded-lg border border-slate-200 bg-white/50 px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                                        placeholder="RPE"
                                      />
                                      <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-slate-400">
                                        RPE
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      value={set.notes ?? ''}
                                      onChange={(e) => {
                                        const newSets = [...exercise.sets]
                                        newSets[setIndex] = { ...set, notes: e.target.value }
                                        updateExercise(exercise.id, { sets: newSets })
                                      }}
                                      className="hidden w-full rounded-lg border border-slate-200 bg-white/50 px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20 sm:block"
                                      placeholder="Notes..."
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSets = exercise.sets.filter((_, i) => i !== setIndex)
                                      updateExercise(exercise.id, { sets: newSets })
                                    }}
                                    className="text-slate-400 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
                                    title="Supprimer la série"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      className="h-4 w-4"
                                    >
                                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        {draft.exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExercise(exercise.id)}
                            className="self-end rounded-full border border-rose-200/60 bg-rose-50/60 px-3 py-1 text-xs font-medium text-rose-500 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                          >
                            Retirer
                          </button>
                        )}
                      </div>
                    </div>
                    {index < draft.exercises.length - 1 && (
                      <div className="mx-auto h-px w-4/5 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-200 bg-white/70 px-5 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isMutating}
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-[1px]"
              >
                {isSubmitting || isMutating ? 'Sauvegarde...' : draft.id ? 'Mettre à jour la séance' : 'Sauvegarder la séance'}
              </button>
            </footer>
          </form>
          )}
        </section>
      </div >
    </div >
  )
}

