import jwt from 'jsonwebtoken'

import { config, isProduction } from '../config.js'

const TOKEN_TTL = '7d'

export function signSessionToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: TOKEN_TTL })
}

export function verifySessionToken(token) {
  return jwt.verify(token, config.jwtSecret)
}

export function buildSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    domain: config.cookieDomain,
  }
}

