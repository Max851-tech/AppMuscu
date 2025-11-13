const WORKOUTS_KEY = 'appmuscu.workouts'
const THEME_KEY = 'appmuscu.theme'

export type ThemePreference = 'light' | 'dark'

export function loadWorkouts<T>(fallback: T): T {
  if (!window.localStorage) return fallback
  try {
    const raw = window.localStorage.getItem(WORKOUTS_KEY)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (error) {
    console.warn('Impossible de charger les séances, utilisation des valeurs par défaut.', error)
    return fallback
  }
}

export function persistWorkouts<T>(value: T) {
  if (!window.localStorage) return
  try {
    window.localStorage.setItem(WORKOUTS_KEY, JSON.stringify(value))
  } catch (error) {
    console.warn('Impossible de sauvegarder les séances.', error)
  }
}

export function loadTheme(defaultTheme: ThemePreference): ThemePreference {
  if (typeof window === 'undefined') return defaultTheme
  try {
    const stored = window.localStorage.getItem(THEME_KEY) as ThemePreference | null
    if (stored === 'dark' || stored === 'light') return stored
  } catch (error) {
    console.warn('Impossible de charger le thème, utilisation de la valeur par défaut.', error)
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : defaultTheme
}

export function persistTheme(theme: ThemePreference) {
  if (!window.localStorage) return
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch (error) {
    console.warn('Impossible de sauvegarder le thème.', error)
  }
}

