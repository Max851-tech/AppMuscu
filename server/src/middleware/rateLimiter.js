import rateLimit from 'express-rate-limit'

const isTest = process.env.NODE_ENV === 'test'

const noOp = (_req, _res, next) => next()

export const authLimiter = isTest
  ? noOp
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Trop de tentatives. Réessaie dans 15 minutes.' },
    })

export const globalLimiter = isTest
  ? noOp
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Trop de requêtes. Réessaie plus tard.' },
    })
