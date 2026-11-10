# MPD — Modèle Physique de Données

SGBD : **PostgreSQL** (Neon en production, `postgres:16-alpine` dans `docker-compose.yml`).

Le script complet est dans [mpd.sql](mpd.sql). Il a été généré par Prisma à partir de `schema.prisma`. Il est vérifié identique à l'enchaînement des deux migrations réelles :

| Ordre | Migration | Effet |
|---|---|---|
| 1 | `20260901120513_baseline` | Crée les 7 tables, les clés primaires, l'index unique sur `email` et les 6 clés étrangères. `weight` est alors en `INTEGER`. |
| 2 | `20260901120605_allow_decimal_weight` | `ALTER COLUMN "weight" SET DATA TYPE DOUBLE PRECISION` sur `ExerciseSet` et `RoutineSet`. |

## Tables et colonnes (état final)

| Table | Colonne | Type PostgreSQL | NULL | Défaut (SQL) |
|---|---|---|---|---|
| User | id | TEXT | NOT NULL | — |
| User | email | TEXT | NOT NULL | — |
| User | passwordHash | TEXT | NOT NULL | — |
| User | name | TEXT | NULL | — |
| User | avatarUrl | TEXT | NULL | — |
| User | createdAt | TIMESTAMP(3) | NOT NULL | CURRENT_TIMESTAMP |
| User | updatedAt | TIMESTAMP(3) | NOT NULL | — |
| User | resetToken | TEXT | NULL | — |
| User | resetTokenExpiry | TIMESTAMP(3) | NULL | — |
| Workout | id | TEXT | NOT NULL | — |
| Workout | userId | TEXT | NOT NULL | — |
| Workout | name | TEXT | NOT NULL | — |
| Workout | date | TIMESTAMP(3) | NOT NULL | CURRENT_TIMESTAMP |
| Workout | focusArea | TEXT | NULL | — |
| Workout | notes | TEXT | NULL | — |
| Workout | createdAt | TIMESTAMP(3) | NOT NULL | CURRENT_TIMESTAMP |
| Workout | updatedAt | TIMESTAMP(3) | NOT NULL | — |
| Exercise | id | TEXT | NOT NULL | — |
| Exercise | workoutId | TEXT | NOT NULL | — |
| Exercise | name | TEXT | NOT NULL | — |
| ExerciseSet | id | TEXT | NOT NULL | — |
| ExerciseSet | exerciseId | TEXT | NOT NULL | — |
| ExerciseSet | reps | INTEGER | NOT NULL | — |
| ExerciseSet | weight | DOUBLE PRECISION | NOT NULL | — |
| ExerciseSet | rpe | INTEGER | NULL | — |
| ExerciseSet | notes | TEXT | NULL | — |
| Routine | id | TEXT | NOT NULL | — |
| Routine | userId | TEXT | NOT NULL | — |
| Routine | name | TEXT | NOT NULL | — |
| Routine | focusArea | TEXT | NULL | — |
| Routine | createdAt | TIMESTAMP(3) | NOT NULL | CURRENT_TIMESTAMP |
| Routine | updatedAt | TIMESTAMP(3) | NOT NULL | — |
| RoutineExercise | id | TEXT | NOT NULL | — |
| RoutineExercise | routineId | TEXT | NOT NULL | — |
| RoutineExercise | name | TEXT | NOT NULL | — |
| RoutineSet | id | TEXT | NOT NULL | — |
| RoutineSet | exerciseId | TEXT | NOT NULL | — |
| RoutineSet | reps | INTEGER | NOT NULL | — |
| RoutineSet | weight | DOUBLE PRECISION | NOT NULL | — |
| RoutineSet | rpe | INTEGER | NULL | — |
| RoutineSet | notes | TEXT | NULL | — |

`TIMESTAMP(3)` signifie : sans fuseau horaire, précision à la milliseconde.

## Contraintes

### Clés primaires et unicité

| Contrainte | Table | Colonne(s) | Type |
|---|---|---|---|
| `User_pkey` | User | id | PRIMARY KEY |
| `Workout_pkey` | Workout | id | PRIMARY KEY |
| `Exercise_pkey` | Exercise | id | PRIMARY KEY |
| `ExerciseSet_pkey` | ExerciseSet | id | PRIMARY KEY |
| `Routine_pkey` | Routine | id | PRIMARY KEY |
| `RoutineExercise_pkey` | RoutineExercise | id | PRIMARY KEY |
| `RoutineSet_pkey` | RoutineSet | id | PRIMARY KEY |
| `User_email_key` | User | email | UNIQUE INDEX |

### Clés étrangères

| Contrainte | Colonne | Référence | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| `Workout_userId_fkey` | Workout.userId | User.id | CASCADE | CASCADE |
| `Routine_userId_fkey` | Routine.userId | User.id | CASCADE | CASCADE |
| `Exercise_workoutId_fkey` | Exercise.workoutId | Workout.id | CASCADE | CASCADE |
| `ExerciseSet_exerciseId_fkey` | ExerciseSet.exerciseId | Exercise.id | CASCADE | CASCADE |
| `RoutineExercise_routineId_fkey` | RoutineExercise.routineId | Routine.id | CASCADE | CASCADE |
| `RoutineSet_exerciseId_fkey` | RoutineSet.exerciseId | RoutineExercise.id | CASCADE | CASCADE |

### Effet des `ON DELETE CASCADE`

```
DELETE User            → supprime ses Workout   → leurs Exercise        → leurs ExerciseSet
                       → supprime ses Routine   → leurs RoutineExercise → leurs RoutineSet
DELETE Workout         → supprime ses Exercise  → leurs ExerciseSet
DELETE Routine         → supprime ses RoutineExercise → leurs RoutineSet
```

Dans le code, la cascade est utilisée par :
- `DELETE /api/workouts/:id` et `DELETE /api/routines/:id`, qui suppriment la séance ou la routine avec tout son contenu ;
- `PUT /api/workouts/:id` et `PUT /api/routines/:id`, qui font un `deleteMany` des exercices puis les recréent dans une transaction Prisma. Les séries sont alors supprimées par cascade.

Aucune route ne supprime un `User`. La cascade depuis `User` est déclarée en base, mais aucun chemin de l'API ne la déclenche aujourd'hui.

## Ce qui n'existe pas en base (à connaître pour l'oral)

- **Pas de type `UUID` PostgreSQL** : les `id` sont des `TEXT`. Le client Prisma génère la valeur UUID v4 (`@default(uuid())`) avant l'`INSERT`.
- **Pas de `DEFAULT` sur `updatedAt`** : le client Prisma fournit la valeur (`@updatedAt`).
- **Pas de contrainte `CHECK`** : rien n'empêche en base un `reps` négatif ou un `rpe` de 15.
- **Pas d'index sur les clés étrangères** (`userId`, `workoutId`, `exerciseId`, `routineId`). PostgreSQL n'en crée pas automatiquement et le schéma Prisma n'en déclare pas (`@@index`).
- **Pas de lien entre `Routine` et `Workout`** : démarrer une séance depuis une routine copie les données côté front (`handleSelectRoutine` dans `src/views/WorkoutsView.tsx`). Aucune clé étrangère n'est créée.
