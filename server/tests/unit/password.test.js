import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../../src/utils/password.js'

describe('password utils', () => {
  it('hashes a password into a bcrypt string', async () => {
    const hash = await hashPassword('MonMotDePasse123')
    expect(hash).toBeDefined()
    expect(hash).not.toBe('MonMotDePasse123')
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true)
  })

  it('produces different hashes for the same password (unique salt)', async () => {
    const hash1 = await hashPassword('MotDePasse')
    const hash2 = await hashPassword('MotDePasse')
    expect(hash1).not.toBe(hash2)
  })

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('Secret123')
    const result = await verifyPassword('Secret123', hash)
    expect(result).toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Secret123')
    const result = await verifyPassword('MauvaisMotDePasse', hash)
    expect(result).toBe(false)
  })
})
