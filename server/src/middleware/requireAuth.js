import { verifySessionToken } from '../utils/jwt.js'
import { prisma } from '../prisma.js'

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.session
    if (!token) {
      return res.status(401).json({ message: 'Non authentifié.' })
    }

    const payload = verifySessionToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user) {
      return res.status(401).json({ message: 'Session invalide.' })
    }

    const { passwordHash, ...safeUser } = user
    req.user = safeUser
    next()
  } catch (error) {
    console.error('[requireAuth]', error)
    return res.status(401).json({ message: 'Authentification requise.' })
  }
}

