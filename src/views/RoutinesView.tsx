import { Fragment, useState } from 'react'

import type { Exercise, ExerciseSet, Routine } from '../types'
import { createUID } from '../utils/id'

type RoutineDraft = {
  id?: string
  name: string
  focusArea?: string
  exercises: Exercise[]
}

type RoutinesViewProps = {
  routines: Routine[]
  onSave: (draft: RoutineDraft) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isLoading: boolean
  isMutating: boolean
}

const emptySet = (): ExerciseSet => ({ id: createUID(), reps: 10, weight: 20 })
const emptyExercise = (): Exercise => ({ id: createUID(), name: '', sets: [emptySet()] })
const newDraft = (): RoutineDraft => ({ name: '', focusArea: '', exercises: [emptyExercise()] })

export default function RoutinesView({ routines, onSave, onDelete, isLoading, isMutating }: RoutinesViewProps) {
  const [draft, setDraft] = useState<RoutineDraft>(newDraft)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelectRoutine = (routine: Routine) => {
    setSelectedId(routine.id)
    setDraft({
      id: routine.id,
      name: routine.name,
      focusArea: routine.focusArea ?? '',
      exercises: routine.exercises.map((e) => ({ ...e })),
    })
    setIsDirty(false)
  }

  const handleReset = () => {
    setSelectedId(null)
    setDraft(newDraft())
    setIsDirty(false)
  }

  const updateExercise = (exerciseId: string, partial: Partial<Exercise>) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) => (e.id === exerciseId ? { ...e, ...partial } : e)),
    }))
    setIsDirty(true)
  }

  const addExercise = () => {
    setDraft((prev) => ({ ...prev, exercises: [...prev.exercises, emptyExercise()] }))
    setIsDirty(true)
  }

  const removeExercise = (exerciseId: string) => {
    setDraft((prev) => ({ ...prev, exercises: prev.exercises.filter((e) => e.id !== exerciseId) }))
    setIsDirty(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.name.trim()) return
    const cleanedExercises = draft.exercises.filter((e) => e.name.trim())
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
      if (!draft.id) handleReset()
      else setIsDirty(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Mes templates</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">
            Routines
            <span className="ml-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
              {routines.length} routine{routines.length > 1 ? 's' : ''}
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
            Nouvelle routine
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {isLoading && (
              <div className="glass-card col-span-full border-dashed border-slate-300 bg-slate-50/40 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                Chargement de tes routines...
              </div>
            )}

            {!isLoading && routines.length === 0 && (
              <div className="glass-card col-span-full border-dashed border-slate-300 bg-slate-50/40 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                <p className="text-lg font-medium">Aucune routine pour l'instant.</p>
                <p className="mt-2 text-sm">Crée un template à droite pour le réutiliser à chaque séance.</p>
              </div>
            )}

            {!isLoading &&
              routines.map((routine) => {
                const isActive = selectedId === routine.id
                return (
                  <article
                    key={routine.id}
                    onClick={() => handleSelectRoutine(routine)}
                    className={`glass-card flex cursor-pointer flex-col gap-4 border px-4 py-5 transition-all ${
                      isActive ? 'ring-2 ring-emerald-400/60' : 'hover:ring-1 hover:ring-emerald-200/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-left text-lg font-semibold text-slate-900 dark:text-white">
                          {routine.name}
                        </h3>
                        {routine.focusArea && (
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{routine.focusArea}</p>
                        )}
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {routine.exercises.length} exo{routine.exercises.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      {routine.exercises.slice(0, 3).map((exercise) => (
                        <span key={exercise.id} className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/60">
                          {exercise.name}
                        </span>
                      ))}
                      {routine.exercises.length > 3 && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/60">
                          +{routine.exercises.length - 3} autres
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          void onDelete(routine.id)
                        }}
                        disabled={isMutating}
                        className="rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 dark:border-transparent dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10"
                      >
                        Supprimer
                      </button>
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
                {draft.id ? 'Modifier la routine' : 'Nouvelle routine'}
              </p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {draft.id ? 'Mets à jour ta routine' : 'Crée un template'}
              </h2>
            </header>

            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Nom de la routine</span>
                <input
                  required
                  value={draft.name}
                  onChange={(e) => { setDraft((prev) => ({ ...prev, name: e.target.value })); setIsDirty(true) }}
                  placeholder="Push A, Legs, Full body..."
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-50 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Focus / objectif</span>
                <input
                  value={draft.focusArea ?? ''}
                  onChange={(e) => { setDraft((prev) => ({ ...prev, focusArea: e.target.value })); setIsDirty(true) }}
                  placeholder="Hypertrophie poitrine, force, mobilité..."
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
                    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <label className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                            Nom de l'exercice
                            <input
                              required
                              value={exercise.name}
                              onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                              placeholder="Développé couché, squat, rowing..."
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                            />
                          </label>
                          {draft.exercises.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeExercise(exercise.id)}
                              className="mt-6 self-end rounded-full border border-rose-200/60 bg-rose-50/60 px-3 py-1 text-xs font-medium text-rose-500 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                            >
                              Retirer
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Séries par défaut
                            </span>
                            <button
                              type="button"
                              onClick={() => updateExercise(exercise.id, { sets: [...exercise.sets, emptySet()] })}
                              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                            >
                              + Ajouter une série
                            </button>
                          </div>

                          {exercise.sets.map((set, setIndex) => (
                            <div key={set.id} className="flex items-center gap-3">
                              <span className="w-6 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                                {setIndex + 1}
                              </span>
                              <div className="grid flex-1 grid-cols-3 gap-2">
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
                                  />
                                  <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-slate-400">reps</span>
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
                                  />
                                  <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-slate-400">kg</span>
                                </label>
                                <label className="relative">
                                  <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={set.rpe ?? ''}
                                    onChange={(e) => {
                                      const newSets = [...exercise.sets]
                                      newSets[setIndex] = { ...set, rpe: e.target.value ? Number(e.target.value) : undefined }
                                      updateExercise(exercise.id, { sets: newSets })
                                    }}
                                    placeholder="RPE"
                                    className="w-full rounded-lg border border-slate-200 bg-white/50 px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                                  />
                                  <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-slate-400">RPE</span>
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newSets = exercise.sets.filter((_, i) => i !== setIndex)
                                  updateExercise(exercise.id, { sets: newSets })
                                }}
                                className="text-slate-400 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
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
                {isSubmitting || isMutating ? 'Sauvegarde...' : draft.id ? 'Mettre à jour' : 'Sauvegarder la routine'}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>
  )
}
