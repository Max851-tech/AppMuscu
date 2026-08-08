process.env.JWT_SECRET = 'test-secret-key-for-vitest'
process.env.NODE_ENV = 'test'
process.env.APP_BASE_URL = 'http://localhost:5173'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb'
