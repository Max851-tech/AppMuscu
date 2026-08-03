import { describe, it, expect } from 'vitest'
import { config, isProduction } from '../../src/config.js'

describe('config', () => {
  it('loads jwtSecret from environment', () => {
    expect(config.jwtSecret).toBe('test-secret-key-for-vitest')
  })

  it('parses appBaseUrls as an array', () => {
    expect(Array.isArray(config.appBaseUrls)).toBe(true)
    expect(config.appBaseUrls.length).toBeGreaterThan(0)
  })

  it('defaults apiBaseUrl to localhost:4000', () => {
    expect(config.apiBaseUrl).toBe('http://localhost:4000')
  })

  it('is not in production mode during tests', () => {
    expect(isProduction).toBe(false)
  })
})
