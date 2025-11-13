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

