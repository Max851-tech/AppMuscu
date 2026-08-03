import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'

import { config, isProduction } from '../config.js'
import { prisma } from '../prisma.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import { hashPassword, verifyPassword } from '../utils/password.js'

export const authRouter = Router()

const setAuthCookie = (res, token) => {
  res.cookie('auth', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    domain: config.cookieDomain,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  })
}

const clearAuthCookie = (res) => {
  res.clearCookie('auth', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    domain: config.cookieDomain,
  })
}

const generateAuthToken = (user) => {
  return jwt.sign({ userId: user.id }, config.jwtSecret, {
    expiresIn: '7d',
  })
}

authRouter.post(
  '/register',
  authLimiter,
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
          passwordHash: hashedPassword,
          name,
        },
      })

      const token = generateAuthToken(user)
      setAuthCookie(res, token)

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
      })
    } catch (error) {
      console.error('[Register error]', error)
      res.status(500).json({ message: 'Impossible de créer le compte pour le moment.' })
    }
  },
)

authRouter.post(
  '/login',
  authLimiter,
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

      const isPasswordValid = await verifyPassword(password, user.passwordHash)
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect.' })
      }

      const token = generateAuthToken(user)
      setAuthCookie(res, token)

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
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
  const token = req.cookies?.auth
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

authRouter.post(
  '/forgot-password',
  authLimiter,
  body('email').isEmail().withMessage('Email invalide'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email } = req.body

    try {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return res.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' })
      }

      const resetToken = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '1h' })
      const resetTokenExpiry = new Date(Date.now() + 3600000)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      })

      const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
      console.log('---------------------------------------------------')
      console.log('LIEN DE RÉINITIALISATION (DEV ONLY) :')
      console.log(resetLink)
      console.log('---------------------------------------------------')

      res.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' })
    } catch (error) {
      console.error('[Forgot Password error]', error)
      res.status(500).json({ message: 'Erreur interne du serveur.' })
    }
  },
)

authRouter.post(
  '/reset-password',
  authLimiter,
  body('token').notEmpty().withMessage('Token manquant'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { token, password } = req.body

    try {
      let decoded
      try {
        decoded = jwt.verify(token, config.jwtSecret)
      } catch (err) {
        return res.status(400).json({ message: 'Lien invalide ou expiré.' })
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      })

      if (!user || user.resetToken !== token || user.resetTokenExpiry < new Date()) {
        return res.status(400).json({ message: 'Lien invalide ou expiré.' })
      }

      const hashedPassword = await hashPassword(password)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      })

      res.json({ message: 'Mot de passe réinitialisé avec succès. Tu peux maintenant te connecter.' })
    } catch (error) {
      console.error('[Reset Password error]', error)
      res.status(500).json({ message: 'Erreur interne du serveur.' })
    }
  },
)
