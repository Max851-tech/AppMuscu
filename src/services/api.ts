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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
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

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' }, false)
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

