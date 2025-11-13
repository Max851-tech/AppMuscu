import { Router } from 'express'
import bcrypt from 'bcryptjs'

import { requireAuth } from '../middleware/requireAuth.js'
import { prisma } from '../prisma.js'
import { buildSessionCookieOptions, signSessionToken } from '../utils/jwt.js'

export const authRouter = Router()

const SALT_ROUNDS = 10

const formatUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name ?? null,
  avatarUrl: user.avatarUrl ?? null,
  createdAt: user.createdAt,
})

const createSession = (res, userId) => {
  const token = signSessionToken({ sub: userId })
  res.cookie('session', token, buildSessionCookieOptions())
}

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body ?? {}

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont obligatoires.' })
    }

    const normalizedEmail = email.toString().trim().toLowerCase()

    if (normalizedEmail.length === 0 || password.toString().length < 8) {
      return res
        .status(400)
        .json({ message: 'Utilise un email valide et un mot de passe de 8 caractères minimum.' })
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet email.' })
    }

    const passwordHash = await bcrypt.hash(password.toString(), SALT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name?.toString().trim() || null,
      },
    })

    createSession(res, user.id)
    return res.status(201).json(formatUser(user))
  } catch (error) {
    console.error('[auth/register]', error)
    return res.status(500).json({ message: 'Impossible de créer le compte pour le moment.' })
  }
})

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {}

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont obligatoires.' })
    }

    const normalizedEmail = email.toString().trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides.' })
    }

    const isValid = await bcrypt.compare(password.toString(), user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ message: 'Identifiants invalides.' })
    }

    createSession(res, user.id)
    return res.json(formatUser(user))
  } catch (error) {
    console.error('[auth/login]', error)
    return res.status(500).json({ message: 'Impossible de se connecter pour le moment.' })
  }
})

authRouter.get('/me', requireAuth, (req, res) => {
  const { id, email, name, avatarUrl, createdAt } = req.user
  res.json({ id, email, name, avatarUrl, createdAt })
})

authRouter.post('/logout', (req, res) => {
  res.clearCookie('session', {
    ...buildSessionCookieOptions(),
    expires: new Date(0),
  })
  res.status(204).end()
})

