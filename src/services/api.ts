import type { Exercise, Workout } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export type ApiUser = {
  id: string
  email: string
  name?: string | null
  avatarUrl?: string | null
  createdAt?: string
}

export type WorkoutPayload = {
  name: string
  date: string
  focusArea?: string
  notes?: string
  exercises: Array<
    Omit<Exercise, 'id'> & {
      id?: string
    }
  >
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  parseJson = true,
): Promise<T> {
  const token = localStorage.getItem('auth_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }

  if (token) {
    // @ts-ignore
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers,
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Une erreur est survenue')
  }

  if (!parseJson) return undefined as T
  return (await response.json()) as T
}

export async function fetchCurrentUser(): Promise<ApiUser | null> {
  try {
    return await request<ApiUser>('/api/auth/me')
  } catch (error) {
    return null
  }
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = LoginPayload & {
  name?: string
}

export async function loginWithEmail(payload: LoginPayload): Promise<ApiUser> {
  const response = await request<{ token: string; user: ApiUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  localStorage.setItem('auth_token', response.token)
  return response.user
}

export async function registerWithEmail(payload: RegisterPayload): Promise<ApiUser> {
  const response = await request<{ token: string; user: ApiUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  localStorage.setItem('auth_token', response.token)
  return response.user
}

export async function logout(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' }, false)
  } finally {
    localStorage.removeItem('auth_token')
  }
}

export async function fetchWorkouts(): Promise<Workout[]> {
  return request<Workout[]>('/api/workouts')
}

export async function createWorkout(payload: WorkoutPayload): Promise<Workout> {
  return request<Workout>('/api/workouts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateWorkout(id: string, payload: WorkoutPayload): Promise<Workout> {
  return request<Workout>(`/api/workouts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteWorkout(id: string): Promise<void> {
  await request(`/api/workouts/${id}`, { method: 'DELETE' }, false)
}

