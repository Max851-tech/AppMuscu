import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsView from '../views/StatsView'
import type { Workout } from '../types'

const makeWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  id: 'w-1',
  name: 'Push Day',
  date: '2026-01-15T00:00:00.000Z',
  focusArea: 'Pectoraux',
  exercises: [
    {
      id: 'ex-1',
      name: 'Bench Press',
      sets: [
        { id: 's-1', reps: 10, weight: 80 },
        { id: 's-2', reps: 8, weight: 85 },
      ],
    },
  ],
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
  ...overrides,
})

describe('StatsView', () => {
  it('shows empty state when no workouts', () => {
    render(<StatsView workouts={[]} />)
    expect(screen.getByText(/Aucune donnée statistique/)).toBeInTheDocument()
  })

  it('renders all four KPI cards', () => {
    render(<StatsView workouts={[makeWorkout()]} />)

    expect(screen.getByText('Volume total soulevé')).toBeInTheDocument()
    expect(screen.getByText('Intensité moyenne')).toBeInTheDocument()
    expect(screen.getByText('Séance record')).toBeInTheDocument()
    expect(screen.getByText('Exercices totaux')).toBeInTheDocument()
  })

  it('renders the volume chart section', () => {
    render(<StatsView workouts={[makeWorkout()]} />)
    expect(screen.getByText('Volume soulevé')).toBeInTheDocument()
  })

  it('renders the zones ciblées section with focus areas', () => {
    render(<StatsView workouts={[makeWorkout()]} />)
    expect(screen.getByText('Zones ciblées')).toBeInTheDocument()
    expect(screen.getAllByText('Pectoraux').length).toBeGreaterThanOrEqual(1)
  })

  it('displays multiple focus areas in the distribution', () => {
    const workouts = [
      makeWorkout({ focusArea: 'Pectoraux' }),
      makeWorkout({ id: 'w-2', date: '2026-01-16T00:00:00.000Z', focusArea: 'Dos' }),
    ]

    render(<StatsView workouts={workouts} />)

    expect(screen.getAllByText('Pectoraux').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Dos').length).toBeGreaterThanOrEqual(1)
  })

  it('shows session count badge', () => {
    const workouts = [
      makeWorkout(),
      makeWorkout({ id: 'w-2', date: '2026-01-16T00:00:00.000Z' }),
    ]

    render(<StatsView workouts={workouts} />)
    expect(screen.getByText(/2 séances/)).toBeInTheDocument()
  })

  it('renders the history table', () => {
    render(<StatsView workouts={[makeWorkout()]} />)
    expect(screen.getByText('Historique détaillé')).toBeInTheDocument()
    expect(screen.getAllByText('Push Day').length).toBeGreaterThanOrEqual(1)
  })
})
