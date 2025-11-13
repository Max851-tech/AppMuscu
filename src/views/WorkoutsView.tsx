import { Fragment, useMemo, useState } from 'react'

import type { Exercise, Workout } from '../types'
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
  onSave: (draft: WorkoutDraft) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

const emptyExercise = (): Exercise => ({
  id: createUID(),
  name: '',
  sets: 3,
  reps: 10,
  weight: 20,
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
  exercises.reduce((acc, exercise) => acc + exercise.sets * exercise.reps * exercise.weight, 0)

export default function WorkoutsView({ workouts, onSave, onDelete, onDuplicate }: WorkoutsViewProps) {
  const [draft, setDraft] = useState<WorkoutDraft>(newDraft)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim()) return
    if (draft.exercises.length === 0) return

    const cleanedExercises = draft.exercises.filter((exercise) => exercise.name.trim())
    if (cleanedExercises.length === 0) return

    onSave({
      ...draft,
      exercises: cleanedExercises.map((exercise) => ({
        ...exercise,
        sets: Number.isFinite(exercise.sets) ? exercise.sets : 0,
        reps: Number.isFinite(exercise.reps) ? exercise.reps : 0,
        weight: Number.isFinite(exercise.weight) ? exercise.weight : 0,
      })),
    })

    if (!draft.id) {
      handleReset()
    } else {
      setIsDirty(false)
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
                <p className="text-lg font-medium">Aucune séance enregistrée pour l’instant.</p>
                <p className="mt-2 text-sm">Crée ta première routine à droite et suis ta progression.</p>
              </div>
            )}

            {sortedWorkouts.map((workout) => {
              const volume = calculateVolume(workout.exercises)
              const badge = intensityBadge(volume)
              const isActive = selectedId === workout.id

              return (
                <article
                  key={workout.id}
                        className={`glass-card flex flex-col gap-4 border px-4 py-5 transition-all ${
                    isActive ? 'ring-2 ring-emerald-400/60' : 'hover:ring-1 hover:ring-emerald-200/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => handleSelectWorkout(workout)}
                        className="text-left text-lg font-semibold text-slate-900 transition hover:text-emerald-600 dark:text-white dark:hover:text-emerald-300"
                      >
                        {workout.name}
                      </button>
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
                      <span
                        key={exercise.id}
                        className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/60"
                      >
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
                        onClick={() => onDuplicate(workout.id)}
                        className="rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-900/60 dark:hover:text-white"
                      >
                        Dupliquer
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(workout.id)}
                        className="rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 dark:border-transparent dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="glass-card border px-6 py-6">
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
                          <div className="grid gap-3 sm:grid-cols-3">
                            <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                              Séries
                              <input
                                type="number"
                                min={1}
                                value={exercise.sets}
                                onChange={(event) => updateExercise(exercise.id, { sets: Number(event.target.value) })}
                                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                              />
                            </label>
                            <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                              Répétitions
                              <input
                                type="number"
                                min={1}
                                value={exercise.reps}
                                onChange={(event) => updateExercise(exercise.id, { reps: Number(event.target.value) })}
                                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                              />
                            </label>
                            <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                              Poids (kg)
                              <input
                                type="number"
                                min={0}
                                value={exercise.weight}
                                onChange={(event) =>
                                  updateExercise(exercise.id, { weight: Number(event.target.value) })
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                              />
                            </label>
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
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-[1px]"
              >
                {draft.id ? 'Mettre à jour la séance' : 'Sauvegarder la séance'}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>
  )
}

