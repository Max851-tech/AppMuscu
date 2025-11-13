import { Router } from 'express'

import { requireAuth } from '../middleware/requireAuth.js'
import { prisma } from '../prisma.js'

export const workoutsRouter = Router()

workoutsRouter.use(requireAuth)

const sanitizeExercise = (exercise) => ({
  name: exercise.name?.toString().trim() ?? '',
  sets: Number.parseInt(exercise.sets, 10) || 0,
  reps: Number.parseInt(exercise.reps, 10) || 0,
  weight: Number.parseInt(exercise.weight, 10) || 0,
})

const serializeWorkout = (workout) => ({
  id: workout.id,
  name: workout.name,
  date: workout.date.toISOString(),
  focusArea: workout.focusArea ?? undefined,
  notes: workout.notes ?? undefined,
  exercises: workout.exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    weight: exercise.weight,
  })),
  createdAt: workout.createdAt.toISOString(),
  updatedAt: workout.updatedAt.toISOString(),
})

workoutsRouter.get('/', async (req, res) => {
  const workouts = await prisma.workout.findMany({
    where: { userId: req.user.id },
    include: { exercises: true },
    orderBy: { date: 'desc' },
  })

  res.json(workouts.map(serializeWorkout))
})

workoutsRouter.post('/', async (req, res) => {
  const { name, date, focusArea, notes, exercises } = req.body ?? {}

  if (!name || !date) {
    return res.status(400).json({ message: 'Les champs name et date sont obligatoires.' })
  }

  const exercisePayload = Array.isArray(exercises) ? exercises.map(sanitizeExercise).filter((item) => item.name) : []

  if (exercisePayload.length === 0) {
    return res.status(400).json({ message: 'Ajoute au moins un exercice.' })
  }

  const workout = await prisma.workout.create({
    data: {
      name: name.toString().trim(),
      date: new Date(date),
      focusArea: focusArea?.toString().trim() || null,
      notes: notes?.toString().trim() || null,
      userId: req.user.id,
      exercises: {
        create: exercisePayload,
      },
    },
    include: { exercises: true },
  })

  res.status(201).json(serializeWorkout(workout))
})

workoutsRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const { name, date, focusArea, notes, exercises } = req.body ?? {}

  const workout = await prisma.workout.findFirst({
    where: { id, userId: req.user.id },
  })

  if (!workout) {
    return res.status(404).json({ message: 'Séance introuvable.' })
  }

  if (!name || !date) {
    return res.status(400).json({ message: 'Les champs name et date sont obligatoires.' })
  }

  const exercisePayload = Array.isArray(exercises) ? exercises.map(sanitizeExercise).filter((item) => item.name) : []

  if (exercisePayload.length === 0) {
    return res.status(400).json({ message: 'Ajoute au moins un exercice.' })
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.exercise.deleteMany({ where: { workoutId: id } })

    return tx.workout.update({
      where: { id },
      data: {
        name: name.toString().trim(),
        date: new Date(date),
        focusArea: focusArea?.toString().trim() || null,
        notes: notes?.toString().trim() || null,
        exercises: {
          create: exercisePayload,
        },
      },
      include: { exercises: true },
    })
  })

  res.json(serializeWorkout(updated))
})

workoutsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params

  const workout = await prisma.workout.findFirst({
    where: { id, userId: req.user.id },
  })

  if (!workout) {
    return res.status(404).json({ message: 'Séance introuvable.' })
  }

  await prisma.workout.delete({ where: { id } })

  res.status(204).end()
})

