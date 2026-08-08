import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'
import { prisma } from '../../src/prisma.js'
import { hashPassword } from '../../src/utils/password.js'
import { signSessionToken } from '../../src/utils/jwt.js'

vi.mock('../../src/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('Auth API — /api/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('returns 201 with a new user on valid data', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'test@example.com',
        name: 'Max',
        avatarUrl: null,
        passwordHash: 'hashed',
      })

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: 'Max' })

      expect(res.status).toBe(201)
      expect(res.body.user.email).toBe('test@example.com')
      expect(res.body.user.name).toBe('Max')
      expect(res.body.token).toBeDefined()
      expect(res.body.user.passwordHash).toBeUndefined()
    })

    it('returns 409 when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'test@example.com' })

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' })

      expect(res.status).toBe(409)
    })

    it('returns 400 on invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })

      expect(res.status).toBe(400)
    })

    it('returns 400 when password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: '123' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('returns 200 with token on valid credentials', async () => {
      const hashed = await hashPassword('password123')
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Max',
        avatarUrl: null,
        passwordHash: hashed,
      })

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })

      expect(res.status).toBe(200)
      expect(res.body.token).toBeDefined()
      expect(res.body.user.email).toBe('test@example.com')
    })

    it('returns 401 on wrong password', async () => {
      const hashed = await hashPassword('password123')
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: hashed,
      })

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })

      expect(res.status).toBe(401)
    })

    it('returns 401 on non-existent email', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@example.com', password: 'password123' })

      expect(res.status).toBe(401)
    })

    it('returns 400 on missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('returns 204 and clears auth cookie', async () => {
      const res = await request(app).post('/api/auth/logout')

      expect(res.status).toBe(204)
      const setCookie = res.headers['set-cookie']
      expect(setCookie).toBeDefined()
    })
  })

  describe('GET /api/auth/me', () => {
    it('returns user when authenticated via Bearer token', async () => {
      const token = signSessionToken({ userId: 'user-1' })
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Max',
        avatarUrl: null,
        passwordHash: 'hashed',
      })

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.email).toBe('test@example.com')
      expect(res.body.passwordHash).toBeUndefined()
    })

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.status).toBe(401)
    })

    it('returns 401 with expired/invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')

      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    it('returns success message even if email does not exist (no leak)', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown@example.com' })

      expect(res.status).toBe(200)
      expect(res.body.message).toContain('Si un compte existe')
    })

    it('returns success and stores reset token for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
      prisma.user.update.mockResolvedValue({})

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })

      expect(res.status).toBe(200)
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            resetToken: expect.any(String),
            resetTokenExpiry: expect.any(Date),
          }),
        }),
      )
    })

    it('returns 400 on invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-valid' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/reset-password', () => {
    it('returns 400 with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-jwt', password: 'newpassword123' })

      expect(res.status).toBe(400)
    })

    it('returns 400 when password is too short', async () => {
      const token = signSessionToken({ userId: 'user-1' })

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: '123' })

      expect(res.status).toBe(400)
    })

    it('resets password with valid token', async () => {
      const token = signSessionToken({ userId: 'user-1' })
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 3600000),
      })
      prisma.user.update.mockResolvedValue({})

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'newpassword123' })

      expect(res.status).toBe(200)
      expect(res.body.message).toContain('réinitialisé')
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resetToken: null,
            resetTokenExpiry: null,
          }),
        }),
      )
    })
  })
})
