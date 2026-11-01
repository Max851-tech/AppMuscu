import { describe, it, expect } from 'vitest'
import { calculateVolume, intensityBadge } from '../utils/workoutStats'
import type { Exercise } from '../types'

describe('calculateVolume', () => {
  it('returns 0 for an empty exercises array', () => {
    expect(calculateVolume([])).toBe(0)
  })

  it('sums reps × weight across all sets of one exercise', () => {
    const exercises: Exercise[] = [
      { id: '1', name: 'Bench Press', sets: [{ id: 's1', reps: 10, weight: 80 }] },
    ]
    expect(calculateVolume(exercises)).toBe(800)
  })

  it('sums across multiple exercises and sets', () => {
    const exercises: Exercise[] = [
      {
        id: '1',
        name: 'Bench Press',
        sets: [
          { id: 's1', reps: 10, weight: 80 },
          { id: 's2', reps: 8, weight: 85 },
        ],
      },
      {
        id: '2',
        name: 'Squat',
        sets: [{ id: 's3', reps: 5, weight: 120 }],
      },
    ]
    expect(calculateVolume(exercises)).toBe(10 * 80 + 8 * 85 + 5 * 120)
  })

  it('handles zero weight or zero reps', () => {
    const exercises: Exercise[] = [
      {
        id: '1',
        name: 'Bodyweight',
        sets: [
          { id: 's1', reps: 15, weight: 0 },
          { id: 's2', reps: 0, weight: 100 },
        ],
      },
    ]
    expect(calculateVolume(exercises)).toBe(0)
  })

  it('handles exercises with no sets', () => {
    const exercises: Exercise[] = [
      { id: '1', name: 'Stretch', sets: [] },
    ]
    expect(calculateVolume(exercises)).toBe(0)
  })
})

describe('intensityBadge', () => {
  it('returns Monstrueux for volume > 20000', () => {
    expect(intensityBadge(20001).label).toBe('Monstrueux')
  })

  it('returns Solide for volume > 12000 and <= 20000', () => {
    expect(intensityBadge(12001).label).toBe('Solide')
    expect(intensityBadge(20000).label).toBe('Solide')
  })

  it('returns Constante for volume > 6000 and <= 12000', () => {
    expect(intensityBadge(6001).label).toBe('Constante')
    expect(intensityBadge(12000).label).toBe('Constante')
  })

  it('returns Légère for volume <= 6000', () => {
    expect(intensityBadge(6000).label).toBe('Légère')
    expect(intensityBadge(0).label).toBe('Légère')
  })
})
