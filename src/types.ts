export type Exercise = {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
}

export type Workout = {
  id: string
  name: string
  date: string
  focusArea?: string
  notes?: string
  exercises: Exercise[]
  createdAt: string
  updatedAt: string
}

export type User = {
  id: string
  email: string
  name?: string | null
  avatarUrl?: string | null
  createdAt: string
}

