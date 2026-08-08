import { describe, it, expect } from 'vitest'
import { signSessionToken, verifySessionToken, buildSessionCookieOptions } from '../../src/utils/jwt.js'

describe('JWT utils', () => {
  describe('signSessionToken / verifySessionToken', () => {
    it('signs and verifies a token with userId', () => {
      const token = signSessionToken({ userId: 'user-123' })
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      const decoded = verifySessionToken(token)
      expect(decoded.userId).toBe('user-123')
    })

    it('includes an expiration claim', () => {
      const token = signSessionToken({ userId: 'user-456' })
      const decoded = verifySessionToken(token)
      expect(decoded.exp).toBeDefined()
      expect(decoded.iat).toBeDefined()
      expect(decoded.exp).toBeGreaterThan(decoded.iat)
    })

    it('throws on an invalid token', () => {
      expect(() => verifySessionToken('invalid-token')).toThrow()
    })

    it('throws on a tampered token', () => {
      const token = signSessionToken({ userId: 'user-789' })
      const tampered = token.slice(0, -5) + 'XXXXX'
      expect(() => verifySessionToken(tampered)).toThrow()
    })
  })

  describe('buildSessionCookieOptions', () => {
    it('returns httpOnly cookie options', () => {
      const options = buildSessionCookieOptions()
      expect(options.httpOnly).toBe(true)
      expect(options.path).toBe('/')
      expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000)
    })

    it('sets secure to false in test/dev environment', () => {
      const options = buildSessionCookieOptions()
      expect(options.secure).toBe(false)
    })

    it('sets sameSite to lax in non-production', () => {
      const options = buildSessionCookieOptions()
      expect(options.sameSite).toBe('lax')
    })
  })
})
