import { config, isProduction } from './config.js'
import { ensureDatabaseConnection } from './prisma.js'
import { app } from './app.js'

const requestedPort = Number(process.env.PORT) || 4000

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`API AppMuscu prête sur ${port} (${isProduction ? 'production' : 'dev'})`)
  })

  server.on('error', (error) => {
    if (error && error.code === 'EADDRINUSE') {
      console.warn(`Le port ${port} est déjà utilisé. Tentative sur le port ${port + 1}...`)
      startServer(port + 1)
      return
    }

    console.error('[Server error]', error)
    process.exitCode = 1
  })
}

ensureDatabaseConnection()
  .then(() => {
    startServer(requestedPort)
  })
  .catch((error) => {
    console.error('Impossible de se connecter à la base de données:', error)
    process.exit(1)
  })
