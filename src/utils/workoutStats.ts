import type { Exercise } from '../types'

export const calculateVolume = (exercises: Exercise[]) =>
  exercises.reduce(
    (acc, exercise) =>
      acc + exercise.sets.reduce((setAcc, set) => setAcc + set.reps * set.weight, 0),
    0,
  )

export const intensityBadge = (volume: number) => {
  if (volume > 20000) return { label: 'Monstrueux', tone: 'bg-rose-500/10 text-rose-500', emoji: '🔥' }
  if (volume > 12000) return { label: 'Solide', tone: 'bg-emerald-500/10 text-emerald-500', emoji: '🚀' }
  if (volume > 6000) return { label: 'Constante', tone: 'bg-cyan-500/10 text-cyan-500', emoji: '📈' }
  return { label: 'Légère', tone: 'bg-slate-500/10 text-slate-500', emoji: '🌱' }
}
