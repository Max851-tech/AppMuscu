import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'

describe('Health check — GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.environment).toBeDefined()
  })
})
