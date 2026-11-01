import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/prisma.js'
import { signSessionToken } from '../../src/utils/jwt.js'

vi.mock('../../src/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    workout: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    exercise: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Max',
  avatarUrl: null,
}

const makeToken = () => signSessionToken({ userId: mockUser.id })

const mockWorkout = {
  id: 'workout-1',
  name: 'Push Day',
  date: new Date('2026-01-15'),
  focusArea: 'Pectoraux',
  notes: null,
  userId: 'user-1',
  exercises: [
    {
      id: 'ex-1',
      name: 'Bench Press',
      sets: [
        { id: 'set-1', reps: 10, weight: 80, rpe: 8, notes: null },
        { id: 'set-2', reps: 8, weight: 85, rpe: 9, notes: null },
      ],
    },
  ],
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
}

describe('Workouts API — /api/workouts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.user.findUnique.mockResolvedValue(mockUser)
  })

  it('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/workouts')
    expect(res.status).toBe(401)
  })

  describe('GET /api/workouts', () => {
    it('returns list of workouts for authenticated user', async () => {
      prisma.workout.findMany.mockResolvedValue([mockWorkout])

      const res = await request(app)
        .get('/api/workouts')
        .set('Cookie', [`auth=${makeToken()}`])

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0].name).toBe('Push Day')
      expect(res.body[0].exercises).toHaveLength(1)
      expect(res.body[0].exercises[0].sets).toHaveLength(2)
    })

    it('returns empty array when user has no workouts', async () => {
      prisma.workout.findMany.mockResolvedValue([])

      const res = await request(app)
        .get('/api/workouts')
        .set('Cookie', [`auth=${makeToken()}`])

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })
  })

  describe('POST /api/workouts', () => {
    it('creates a workout with exercises and sets', async () => {
      prisma.workout.create.mockResolvedValue(mockWorkout)

      const res = await request(app)
        .post('/api/workouts')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({
          name: 'Push Day',
          date: '2026-01-15',
          focusArea: 'Pectoraux',
          exercises: [
            { name: 'Bench Press', sets: [{ reps: 10, weight: 80 }] },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Push Day')
    })

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({ date: '2026-01-15', exercises: [{ name: 'Squat', sets: [{ reps: 5, weight: 100 }] }] })

      expect(res.status).toBe(400)
    })

    it('returns 400 when date is missing', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({ name: 'Leg Day', exercises: [{ name: 'Squat', sets: [{ reps: 5, weight: 100 }] }] })

      expect(res.status).toBe(400)
    })

    it('returns 400 when exercises array is empty', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({ name: 'Leg Day', date: '2026-01-15', exercises: [] })

      expect(res.status).toBe(400)
    })
  })

  describe('PUT /api/workouts/:id', () => {
    it('updates an existing workout', async () => {
      prisma.workout.findFirst.mockResolvedValue(mockWorkout)
      const updated = { ...mockWorkout, name: 'Pull Day' }
      prisma.$transaction.mockImplementation(async (fn) => {
        prisma.workout.update.mockResolvedValue(updated)
        return fn(prisma)
      })

      const res = await request(app)
        .put('/api/workouts/workout-1')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({
          name: 'Pull Day',
          date: '2026-01-15',
          exercises: [
            { name: 'Barbell Row', sets: [{ reps: 10, weight: 70 }] },
          ],
        })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Pull Day')
    })

    it('returns 400 when name is missing', async () => {
      prisma.workout.findFirst.mockResolvedValue(mockWorkout)

      const res = await request(app)
        .put('/api/workouts/workout-1')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({
          date: '2026-01-15',
          exercises: [{ name: 'Squat', sets: [{ reps: 5, weight: 100 }] }],
        })

      expect(res.status).toBe(400)
    })

    it('returns 400 when exercises are empty', async () => {
      prisma.workout.findFirst.mockResolvedValue(mockWorkout)

      const res = await request(app)
        .put('/api/workouts/workout-1')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({ name: 'Push Day', date: '2026-01-15', exercises: [] })

      expect(res.status).toBe(400)
    })

    it('returns 404 for non-existent workout', async () => {
      prisma.workout.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .put('/api/workouts/unknown-id')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({
          name: 'Push Day',
          date: '2026-01-15',
          exercises: [{ name: 'Bench Press', sets: [{ reps: 10, weight: 80 }] }],
        })

      expect(res.status).toBe(404)
    })
  })

  describe('Ownership — another user cannot access workouts', () => {
    const otherToken = () => signSessionToken({ userId: 'user-2' })

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'other@example.com',
        name: 'Other',
        avatarUrl: null,
      })
    })

    it('PUT returns 404 for another user workout', async () => {
      prisma.workout.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .put('/api/workouts/workout-1')
        .set('Cookie', [`auth=${otherToken()}`])
        .send({
          name: 'Hijack',
          date: '2026-01-15',
          exercises: [{ name: 'Bench', sets: [{ reps: 10, weight: 80 }] }],
        })

      expect(res.status).toBe(404)
    })

    it('DELETE returns 404 for another user workout', async () => {
      prisma.workout.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .delete('/api/workouts/workout-1')
        .set('Cookie', [`auth=${otherToken()}`])

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/workouts/:id', () => {
    it('deletes an existing workout', async () => {
      prisma.workout.findFirst.mockResolvedValue(mockWorkout)
      prisma.workout.delete.mockResolvedValue(mockWorkout)

      const res = await request(app)
        .delete('/api/workouts/workout-1')
        .set('Cookie', [`auth=${makeToken()}`])

      expect(res.status).toBe(204)
    })

    it('returns 404 for non-existent workout', async () => {
      prisma.workout.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .delete('/api/workouts/unknown-id')
        .set('Cookie', [`auth=${makeToken()}`])

      expect(res.status).toBe(404)
    })
  })
})
