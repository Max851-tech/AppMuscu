import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

let isConnected = false

export async function ensureDatabaseConnection() {
  try {
    await prisma.$connect()
    isConnected = true
    console.log('✅ Connecté à la base de données')
    return true
  } catch (error) {
    isConnected = false
    console.error('❌ Impossible de se connecter à la base de données:', error.message)
    return false
  }
}

export function isDatabaseConnected() {
  return isConnected
}

// Retry connection every 5 seconds if disconnected
export function startConnectionRetry() {
  setInterval(async () => {
    if (!isConnected) {
      console.log('🔄 Tentative de reconnexion à la base de données...')
      await ensureDatabaseConnection()
    }
  }, 5000)
}

