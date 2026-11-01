import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/prisma.js'
import { signSessionToken } from '../../src/utils/jwt.js'

vi.mock('../../src/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    routine: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    routineExercise: { deleteMany: vi.fn() },
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

const mockRoutine = {
  id: 'routine-1',
  name: 'PPL Push',
  focusArea: 'Pectoraux',
  userId: 'user-1',
  exercises: [
    {
      id: 'rex-1',
      name: 'Bench Press',
      sets: [
        { id: 'rs-1', reps: 10, weight: 80, rpe: null, notes: null },
      ],
    },
  ],
  createdAt: new Date('2026-01-10'),
  updatedAt: new Date('2026-01-10'),
}

describe('Routines API — /api/routines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.user.findUnique.mockResolvedValue(mockUser)
  })

  it('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/routines')
    expect(res.status).toBe(401)
  })

  describe('GET /api/routines', () => {
    it('returns list of routines for authenticated user', async () => {
      prisma.routine.findMany.mockResolvedValue([mockRoutine])

      const res = await request(app)
        .get('/api/routines')
        .set('Cookie', [`auth=${makeToken()}`])

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].name).toBe('PPL Push')
      expect(res.body[0].exercises[0].sets).toHaveLength(1)
    })
  })

  describe('POST /api/routines', () => {
    it('creates a routine with exercises', async () => {
      prisma.routine.create.mockResolvedValue(mockRoutine)

      const res = await request(app)
        .post('/api/routines')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({
          name: 'PPL Push',
          focusArea: 'Pectoraux',
          exercises: [
            { name: 'Bench Press', sets: [{ reps: 10, weight: 80 }] },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('PPL Push')
    })

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/routines')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({ exercises: [{ name: 'Squat', sets: [{ reps: 5, weight: 100 }] }] })

      expect(res.status).toBe(400)
    })

    it('returns 400 when no exercises provided', async () => {
      const res = await request(app)
        .post('/api/routines')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({ name: 'Empty Routine', exercises: [] })

      expect(res.status).toBe(400)
    })
  })

  describe('PUT /api/routines/:id', () => {
    it('updates an existing routine', async () => {
      prisma.routine.findFirst.mockResolvedValue(mockRoutine)
      const updated = { ...mockRoutine, name: 'PPL Pull' }
      prisma.$transaction.mockImplementation(async (fn) => {
        prisma.routine.update.mockResolvedValue(updated)
        return fn(prisma)
      })

      const res = await request(app)
        .put('/api/routines/routine-1')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({
          name: 'PPL Pull',
          exercises: [
            { name: 'Barbell Row', sets: [{ reps: 10, weight: 70 }] },
          ],
        })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('PPL Pull')
    })

    it('returns 400 when name is missing', async () => {
      prisma.routine.findFirst.mockResolvedValue(mockRoutine)

      const res = await request(app)
        .put('/api/routines/routine-1')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({
          exercises: [{ name: 'Squat', sets: [{ reps: 5, weight: 100 }] }],
        })

      expect(res.status).toBe(400)
    })

    it('returns 400 when exercises are empty', async () => {
      prisma.routine.findFirst.mockResolvedValue(mockRoutine)

      const res = await request(app)
        .put('/api/routines/routine-1')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({ name: 'PPL Push', exercises: [] })

      expect(res.status).toBe(400)
    })

    it('returns 404 for non-existent routine', async () => {
      prisma.routine.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .put('/api/routines/unknown-id')
        .set('Cookie', [`auth=${makeToken()}`])
        .send({
          name: 'PPL Push',
          exercises: [{ name: 'Bench Press', sets: [{ reps: 10, weight: 80 }] }],
        })

      expect(res.status).toBe(404)
    })
  })

  describe('Ownership — another user cannot access routines', () => {
    const otherToken = () => signSessionToken({ userId: 'user-2' })

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'other@example.com',
        name: 'Other',
        avatarUrl: null,
      })
    })

    it('PUT returns 404 for another user routine', async () => {
      prisma.routine.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .put('/api/routines/routine-1')
        .set('Cookie', [`auth=${otherToken()}`])
        .send({
          name: 'Hijack',
          exercises: [{ name: 'Bench', sets: [{ reps: 10, weight: 80 }] }],
        })

      expect(res.status).toBe(404)
    })

    it('DELETE returns 404 for another user routine', async () => {
      prisma.routine.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .delete('/api/routines/routine-1')
        .set('Cookie', [`auth=${otherToken()}`])

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/routines/:id', () => {
    it('deletes an existing routine', async () => {
      prisma.routine.findFirst.mockResolvedValue(mockRoutine)
      prisma.routine.delete.mockResolvedValue(mockRoutine)

      const res = await request(app)
        .delete('/api/routines/routine-1')
        .set('Cookie', [`auth=${makeToken()}`])

      expect(res.status).toBe(204)
    })

    it('returns 404 for non-existent routine', async () => {
      prisma.routine.findFirst.mockResolvedValue(null)

      const res = await request(app)
        .delete('/api/routines/unknown-id')
        .set('Cookie', [`auth=${makeToken()}`])

      expect(res.status).toBe(404)
    })
  })
})
