import { describe, it, expect, beforeEach } from 'vitest'
import { createUID } from '../utils/id'
import { loadTheme, persistTheme } from '../utils/storage'

describe('createUID', () => {
  it('returns a non-empty string', () => {
    const uid = createUID()
    expect(typeof uid).toBe('string')
    expect(uid.length).toBeGreaterThan(0)
  })

  it('returns unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createUID()))
    expect(ids.size).toBe(100)
  })
})

describe('theme storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadTheme returns stored theme if valid', () => {
    localStorage.setItem('appmuscu.theme', 'dark')
    expect(loadTheme('light')).toBe('dark')
  })

  it('loadTheme returns default when nothing stored', () => {
    expect(loadTheme('light')).toBe('light')
  })

  it('loadTheme ignores invalid stored values', () => {
    localStorage.setItem('appmuscu.theme', 'invalid-value')
    expect(loadTheme('light')).toBe('light')
  })

  it('persistTheme saves theme to localStorage', () => {
    persistTheme('dark')
    expect(localStorage.getItem('appmuscu.theme')).toBe('dark')
  })

  it('persistTheme overwrites previous value', () => {
    persistTheme('dark')
    persistTheme('light')
    expect(localStorage.getItem('appmuscu.theme')).toBe('light')
  })
})
