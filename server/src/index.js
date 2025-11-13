import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { passport } from './auth/passport.js'
import { config, isProduction } from './config.js'
import { ensureDatabaseConnection } from './prisma.js'
import { authRouter } from './routes/auth.js'
import { workoutsRouter } from './routes/workouts.js'

const app = express()

app.set('trust proxy', 1)

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)

app.use(
  cors({
    origin: config.appBaseUrls,
    credentials: true,
  }),
)

app.use(cookieParser())
app.use(express.json())
app.use(passport.initialize())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', environment: config.nodeEnv })
})

app.use('/api/auth', authRouter)
app.use('/api/workouts', workoutsRouter)

app.use((err, _req, res, _next) => {
  console.error('[Unhandled error]', err)
  res.status(500).json({ message: 'Erreur interne du serveur.' })
})

const port = Number(process.env.PORT) || 4000

ensureDatabaseConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`API AppMuscu prête sur ${port} (${isProduction ? 'production' : 'dev'})`)
    })
  })
  .catch((error) => {
    console.error('Impossible de se connecter à la base de données:', error)
    process.exit(1)
  })

