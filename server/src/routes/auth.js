import { Router } from 'express'

import { passport } from '../auth/passport.js'
import { config } from '../config.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { buildSessionCookieOptions, signSessionToken } from '../utils/jwt.js'

export const authRouter = Router()

function sanitizeRedirect(target) {
  if (!target) return config.appBaseUrls[0]
  const decoded = decodeURIComponent(target)
  const allowed = config.appBaseUrls.find((base) => decoded.startsWith(base))
  return allowed ? decoded : config.appBaseUrls[0]
}

authRouter.get('/google', (req, res, next) => {
  const redirect = sanitizeRedirect(req.query.redirect)
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    state: encodeURIComponent(redirect),
  })(req, res, next)
})

authRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${config.appBaseUrls[0]}/auth/erreur` }),
  (req, res) => {
    const token = signSessionToken({ sub: req.user.id })
    res.cookie('session', token, buildSessionCookieOptions())
    const redirectState = sanitizeRedirect(req.query.state)
    const redirectUrl = `${redirectState.replace(/\/$/, '')}/auth/success`
    res.redirect(redirectUrl)
  },
)

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

