import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

import { config } from '../config.js'
import { prisma } from '../prisma.js'

const strategy = new GoogleStrategy(
  {
    clientID: config.googleClientId,
    clientSecret: config.googleClientSecret,
    callbackURL: `${config.apiBaseUrl}/api/auth/google/callback`,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const googleId = profile.id
      const email = profile.emails?.[0]?.value?.toLowerCase()
      const name = profile.displayName
      const avatarUrl = profile.photos?.[0]?.value

      if (!email) {
        return done(new Error('Google ne fournit pas d’email.'), undefined)
      }

      const user = await prisma.user.upsert({
        where: { googleId },
        update: {
          email,
          name,
          avatarUrl,
        },
        create: {
          googleId,
          email,
          name,
          avatarUrl,
        },
      })

      return done(null, user)
    } catch (error) {
      return done(error, undefined)
    }
  },
)

passport.use(strategy)

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

export { passport }

