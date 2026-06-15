import { Router } from 'express'

import { requireAuth } from '../middleware/requireAuth.js'
import { prisma } from '../prisma.js'

export const routinesRouter = Router()

routinesRouter.use(requireAuth)

const sanitizeSet = (set) => ({
  reps: Number.parseInt(set.reps, 10) || 0,
  weight: Number.parseInt(set.weight, 10) || 0,
  rpe: set.rpe ? Number.parseInt(set.rpe, 10) : null,
  notes: set.notes?.toString().trim() || null,
})

const sanitizeExercise = (exercise) => ({
  name: exercise.name?.toString().trim() ?? '',
  sets: Array.isArray(exercise.sets) ? exercise.sets.map(sanitizeSet) : [],
})

const serializeRoutine = (routine) => ({
  id: routine.id,
  name: routine.name,
  focusArea: routine.focusArea ?? undefined,
  exercises: routine.exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    sets: exercise.sets.map((set) => ({
      id: set.id,
      reps: set.reps,
      weight: set.weight,
      rpe: set.rpe,
      notes: set.notes,
    })),
  })),
  createdAt: routine.createdAt.toISOString(),
  updatedAt: routine.updatedAt.toISOString(),
})

routinesRouter.get('/', async (req, res) => {
  const routines = await prisma.routine.findMany({
    where: { userId: req.user.id },
    include: {
      exercises: {
        include: { sets: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(routines.map(serializeRoutine))
})

routinesRouter.post('/', async (req, res) => {
  const { name, focusArea, exercises } = req.body ?? {}

  if (!name) {
    return res.status(400).json({ message: 'Le champ name est obligatoire.' })
  }

  const exercisePayload = Array.isArray(exercises) ? exercises.map(sanitizeExercise).filter((item) => item.name) : []

  if (exercisePayload.length === 0) {
    return res.status(400).json({ message: 'Ajoute au moins un exercice.' })
  }

  const routine = await prisma.routine.create({
    data: {
      name: name.toString().trim(),
      focusArea: focusArea?.toString().trim() || null,
      userId: req.user.id,
      exercises: {
        create: exercisePayload.map((ex) => ({
          name: ex.name,
          sets: { create: ex.sets },
        })),
      },
    },
    include: {
      exercises: { include: { sets: true } },
    },
  })

  res.status(201).json(serializeRoutine(routine))
})

routinesRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const { name, focusArea, exercises } = req.body ?? {}

  const routine = await prisma.routine.findFirst({
    where: { id, userId: req.user.id },
  })

  if (!routine) {
    return res.status(404).json({ message: 'Routine introuvable.' })
  }

  if (!name) {
    return res.status(400).json({ message: 'Le champ name est obligatoire.' })
  }

  const exercisePayload = Array.isArray(exercises) ? exercises.map(sanitizeExercise).filter((item) => item.name) : []

  if (exercisePayload.length === 0) {
    return res.status(400).json({ message: 'Ajoute au moins un exercice.' })
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.routineExercise.deleteMany({ where: { routineId: id } })

    return tx.routine.update({
      where: { id },
      data: {
        name: name.toString().trim(),
        focusArea: focusArea?.toString().trim() || null,
        exercises: {
          create: exercisePayload.map((ex) => ({
            name: ex.name,
            sets: { create: ex.sets },
          })),
        },
      },
      include: {
        exercises: { include: { sets: true } },
      },
    })
  })

  res.json(serializeRoutine(updated))
})

routinesRouter.delete('/:id', async (req, res) => {
  const { id } = req.params

  const routine = await prisma.routine.findFirst({
    where: { id, userId: req.user.id },
  })

  if (!routine) {
    return res.status(404).json({ message: 'Routine introuvable.' })
  }

  await prisma.routine.delete({ where: { id } })

  res.status(204).end()
})
