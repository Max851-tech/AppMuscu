import { useMemo } from 'react'

import type { Workout } from '../types'

type StatsViewProps = {
  workouts: Workout[]
}

const calculateVolume = (workout: Workout) =>
  workout.exercises.reduce(
    (acc, exercise) =>
      acc + exercise.sets.reduce((setAcc, set) => setAcc + set.reps * set.weight, 0),
    0
  )

const formatNumber = (value: number) => value.toLocaleString('fr-FR')

export default function StatsView({ workouts }: StatsViewProps) {
  const stats = useMemo(() => {
    if (workouts.length === 0) {
      return {
        totalVolume: 0,
        averageVolume: 0,
        bestSession: null as Workout | null,
        focusAreas: [] as Array<{ label: string; value: number }>,
        timeline: [] as Array<{ date: string; volume: number }>,
        totalExercises: 0,
      }
    }

    const totals = workouts.map((workout) => ({
      workout,
      volume: calculateVolume(workout),
    }))

    const totalVolume = totals.reduce((acc, { volume }) => acc + volume, 0)
    const bestSession = totals.reduce((max, current) => (current.volume > max.volume ? current : max), totals[0])
    const focusAreasMap = new Map<string, number>()
    let totalExercises = 0

    workouts.forEach((workout) => {
      const focus = workout.focusArea?.trim() || 'Non défini'
      focusAreasMap.set(focus, (focusAreasMap.get(focus) ?? 0) + 1)
      totalExercises += workout.exercises.length
    })

    const focusAreas = Array.from(focusAreasMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)

    const timeline = totals
      .slice()
      .sort((a, b) => new Date(a.workout.date).getTime() - new Date(b.workout.date).getTime())
      .map(({ workout, volume }) => ({
        date: workout.date,
        volume,
      }))

    return {
      totalVolume,
      averageVolume: Math.round(totalVolume / totals.length),
      bestSession: bestSession.workout,
      focusAreas,
      timeline,
      totalExercises,
    }
  }, [workouts])

  if (workouts.length === 0) {
    return (
      <div className="glass-card border p-10 text-center text-slate-500 dark:text-slate-400">
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Aucune donnée statistique pour le moment.</p>
        <p className="mt-2 text-sm">Enregistre quelques séances pour voir ta progression et tes tendances.</p>
      </div>
    )
  }

  const maxVolume = Math.max(...stats.timeline.map((entry) => entry.volume), 1)

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Progression</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Stats & tendances intelligentes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Analyse ton volume total, identifie tes points forts et garde un œil sur tes évolutions.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card border p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Volume total soulevé</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {formatNumber(stats.totalVolume)} <span className="text-base font-normal text-slate-500">kg</span>
          </p>
        </div>

        <div className="glass-card border p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Intensité moyenne</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {formatNumber(stats.averageVolume)} <span className="text-base font-normal text-slate-500">kg / séance</span>
          </p>
        </div>

        <div className="glass-card border p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Séance record</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
            {stats.bestSession?.name ?? '—'}
          </p>
          {stats.bestSession && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {new Date(stats.bestSession.date).toLocaleDateString('fr-FR')} •{' '}
              {formatNumber(calculateVolume(stats.bestSession))} kg
            </p>
          )}
        </div>

        <div className="glass-card border p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Exercices totaux</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {formatNumber(stats.totalExercises)} <span className="text-base font-normal text-slate-500">variantes</span>
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="glass-card border p-6">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Volume soulevé</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Chaque point représente une séance enregistrée.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
              {stats.timeline.length} séance{stats.timeline.length > 1 ? 's' : ''}
            </span>
          </header>

          <div className="mt-6 h-64 w-full">
            <svg viewBox="0 0 320 200" preserveAspectRatio="none" className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id="volume-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="5%" stopColor="rgba(16, 185, 129, 0.35)" />
                  <stop offset="95%" stopColor="rgba(16, 185, 129, 0)" />
                </linearGradient>
              </defs>
              <polygon
                points={stats.timeline
                  .map((entry, index) => {
                    const x = (index / Math.max(stats.timeline.length - 1, 1)) * 320
                    const y = 200 - (entry.volume / maxVolume) * 180 - 10
                    return `${x},${y}`
                  })
                  .join(' ')}
                fill="url(#volume-gradient)"
                stroke="none"
              />
              <polyline
                fill="none"
                stroke="rgba(16, 185, 129, 0.9)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={stats.timeline
                  .map((entry, index) => {
                    const x = (index / Math.max(stats.timeline.length - 1, 1)) * 320
                    const y = 200 - (entry.volume / maxVolume) * 180 - 10
                    return `${x},${y}`
                  })
                  .join(' ')}
              />
              {stats.timeline.map((entry, index) => {
                const x = (index / Math.max(stats.timeline.length - 1, 1)) * 320
                const y = 200 - (entry.volume / maxVolume) * 180 - 10
                return (
                  <g key={entry.date}>
                    <circle cx={x} cy={y} r={5} fill="white" stroke="rgba(16, 185, 129, 0.9)" strokeWidth={2} />
                    <text
                      x={x}
                      y={y - 12}
                      textAnchor="middle"
                      fontSize="10"
                      className="fill-slate-500 dark:fill-slate-400"
                    >
                      {formatNumber(entry.volume)}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400 dark:text-slate-500">
            {stats.timeline.map((entry) => (
              <span key={entry.date} className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">
                {new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-card border p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Zones ciblées</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Répartition de tes objectifs de séance.</p>
          <div className="mt-5 space-y-3">
            {stats.focusAreas.map((area) => (
              <div key={area.label} className="flex items-center justify-between rounded-xl bg-slate-100/60 p-3 dark:bg-slate-900/60">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{area.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {(area.value / workouts.length * 100).toFixed(0)}% des séances
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{area.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card border p-6">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Historique détaillé</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-900/80 dark:text-slate-300">
            Dernières séances
          </span>
        </header>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Séance</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Exercices</th>
                <th className="px-4 py-2 font-medium">Volume total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/60">
              {workouts
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((workout) => (
                  <tr key={workout.id} className="transition hover:bg-slate-100/60 dark:hover:bg-slate-900/60">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <div className="font-medium">{workout.name}</div>
                      {workout.focusArea && (
                        <div className="text-xs text-slate-400 dark:text-slate-500">{workout.focusArea}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {new Date(workout.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{workout.exercises.length}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-200">
                      {formatNumber(calculateVolume(workout))} kg
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

