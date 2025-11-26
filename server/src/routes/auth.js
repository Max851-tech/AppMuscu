import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'

import { config, isProduction } from '../config.js'
import { prisma } from '../prisma.js'
import { hashPassword, verifyPassword } from '../utils/password.js'

export const authRouter = Router()

const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production'

  res.cookie('auth', token, {
    httpOnly: true,
    // DEBUT DE LA MODIFICATION
    secure: isProduction, // Doit être true en production (HTTPS )
    sameSite: isProduction ? 'None' : 'Lax', // Doit être 'None' en production pour les requêtes cross-site
    // FIN DE LA MODIFICATION
    domain: config.cookieDomain,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
  })
}

const clearAuthCookie = (res) => {
  res.clearCookie('auth', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    domain: config.cookieDomain,
  } )
}

const generateAuthToken = (user) => {
  return jwt.sign({ userId: user.id }, config.jwtSecret, {
    expiresIn: '7d',
  })
}

authRouter.post(
  '/register',
  body('email').isEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password, name } = req.body

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return res.status(409).json({ message: 'Cet email est déjà utilisé.' })
      }

      const hashedPassword = await hashPassword(password)

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      })

      const token = generateAuthToken(user)
      setAuthCookie(res, token)

      res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      })
    } catch (error) {
      console.error('[Register error]', error)
      res.status(500).json({ message: 'Impossible de créer le compte pour le moment.' })
    }
  },
)

authRouter.post(
  '/login',
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    try {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect.' })
      }

      const isPasswordValid = await verifyPassword(password, user.password)
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect.' })
      }

      const token = generateAuthToken(user)
      setAuthCookie(res, token)

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      })
    } catch (error) {
      console.error('[Login error]', error)
      res.status(500).json({ message: 'Erreur interne du serveur.' })
    }
  },
)

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res)
  res.status(204).end()
})

authRouter.get('/me', async (req, res) => {
  const token = req.cookies.auth
  if (!token) {
    return res.status(401).json({ message: 'Non authentifié.' })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      clearAuthCookie(res)
      return res.status(401).json({ message: 'Non authentifié.' })
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    })
  } catch (error) {
    clearAuthCookie(res)
    res.status(401).json({ message: 'Session expirée ou invalide.' })
  }
})
