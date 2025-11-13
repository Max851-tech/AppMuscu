import dotenv from 'dotenv'

dotenv.config()

const requiredKeys = ['DATABASE_URL', 'JWT_SECRET', 'APP_BASE_URL']

requiredKeys.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[config] Missing environment variable ${key}.`)
  }
})

const parseOrigins = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  appBaseUrls: process.env.APP_BASE_URL ? parseOrigins(process.env.APP_BASE_URL) : ['http://localhost:5173'],
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:4000',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  nodeEnv: process.env.NODE_ENV ?? 'development',
}

export const isProduction = config.nodeEnv === 'production'

