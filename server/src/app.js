import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { config } from './config.js'
import { authRouter } from './routes/auth.js'
import { routinesRouter } from './routes/routines.js'
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
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', environment: config.nodeEnv })
})

app.use('/api/auth', authRouter)
app.use('/api/workouts', workoutsRouter)
app.use('/api/routines', routinesRouter)

app.use((err, _req, res, _next) => {
  console.error('[Unhandled error]', err)
  res.status(500).json({ message: 'Erreur interne du serveur.' })
})

export { app }
