# Modèle de données — App Muscu

## SGBD

- **PostgreSQL** hébergé sur **Neon** (serverless)
- ORM : **Prisma** avec migrations versionnées
- Identifiants : UUID v4 pour toutes les tables

## Schéma relationnel

```
┌──────────────────────┐
│        User          │
├──────────────────────┤
│ PK  id          UUID │
│     email     UNIQUE │
│     passwordHash     │
│     name         ?   │
│     avatarUrl    ?   │
│     resetToken   ?   │
│     resetTokenExpiry? │
│     createdAt        │
│     updatedAt        │
├──────────────────────┤
│ 1──N  Workout        │
│ 1──N  Routine        │
└──────────────────────┘
          │
    ┌─────┴──────────────────────────┐
    │                                │
    ▼                                ▼
┌──────────────────────┐   ┌──────────────────────┐
│      Workout         │   │      Routine         │
├──────────────────────┤   ├──────────────────────┤
│ PK  id          UUID │   │ PK  id          UUID │
│ FK  userId      UUID │   │ FK  userId      UUID │
│     name             │   │     name             │
│     date             │   │     focusArea    ?   │
│     focusArea    ?   │   │     createdAt        │
│     notes        ?   │   │     updatedAt        │
│     createdAt        │   ├──────────────────────┤
│     updatedAt        │   │ 1──N RoutineExercise │
├──────────────────────┤   └──────────────────────┘
│ 1──N  Exercise       │              │
└──────────────────────┘              ▼
          │              ┌──────────────────────┐
          ▼              │  RoutineExercise     │
┌──────────────────────┐ ├──────────────────────┤
│     Exercise         │ │ PK  id          UUID │
├──────────────────────┤ │ FK  routineId   UUID │
│ PK  id          UUID │ │     name             │
│ FK  workoutId   UUID │ ├──────────────────────┤
│     name             │ │ 1──N RoutineSet      │
├──────────────────────┤ └──────────────────────┘
│ 1──N  ExerciseSet    │              │
└──────────────────────┘              ▼
          │              ┌──────────────────────┐
          ▼              │    RoutineSet        │
┌──────────────────────┐ ├──────────────────────┤
│    ExerciseSet       │ │ PK  id          UUID │
├──────────────────────┤ │ FK  exerciseId  UUID │
│ PK  id          UUID │ │     reps        INT  │
│ FK  exerciseId  UUID │ │     weight      INT  │
│     reps        INT  │ │     rpe         ?    │
│     weight      INT  │ │     notes       ?    │
│     rpe         ?    │ └──────────────────────┘
│     notes       ?    │
└──────────────────────┘
```

## Détail des tables

### User

Stocke les comptes utilisateurs et les informations d'authentification.

| Colonne | Type | Contraintes | Description |
|---------|------|------------|-------------|
| `id` | UUID | PK, auto-généré | Identifiant unique |
| `email` | String | UNIQUE, NOT NULL | Adresse email |
| `passwordHash` | String | NOT NULL | Hash bcrypt du mot de passe |
| `name` | String | nullable | Prénom ou pseudo |
| `avatarUrl` | String | nullable | URL de l'avatar |
| `resetToken` | String | nullable | Token JWT de réinitialisation |
| `resetTokenExpiry` | DateTime | nullable | Expiration du token (1h) |
| `createdAt` | DateTime | auto | Date de création |
| `updatedAt` | DateTime | auto | Dernière modification |

### Workout

Représente une séance d'entraînement réalisée.

| Colonne | Type | Contraintes | Description |
|---------|------|------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `userId` | UUID | FK → User.id | Propriétaire |
| `name` | String | NOT NULL | Nom de la séance |
| `date` | DateTime | NOT NULL | Date de la séance |
| `focusArea` | String | nullable | Zone ciblée (Pectoraux, Dos…) |
| `notes` | String | nullable | Notes libres |
| `createdAt` | DateTime | auto | Date de création |
| `updatedAt` | DateTime | auto | Dernière modification |

### Exercise

Exercice réalisé dans une séance.

| Colonne | Type | Contraintes | Description |
|---------|------|------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `workoutId` | UUID | FK → Workout.id | Séance parente |
| `name` | String | NOT NULL | Nom de l'exercice |

### ExerciseSet

Série individuelle d'un exercice (reps × poids).

| Colonne | Type | Contraintes | Description |
|---------|------|------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `exerciseId` | UUID | FK → Exercise.id | Exercice parent |
| `reps` | Int | NOT NULL | Nombre de répétitions |
| `weight` | Int | NOT NULL | Poids en kg |
| `rpe` | Int | nullable | Effort perçu (1-10) |
| `notes` | String | nullable | Notes sur la série |

### Routine / RoutineExercise / RoutineSet

Structure miroir de Workout/Exercise/ExerciseSet pour les templates réutilisables. Même schéma, sans le champ `date`.

## Relations et cascades

Toutes les relations utilisent `onDelete: Cascade` :

```
User ──(supprimé)──→ tous ses Workouts supprimés
                  ──→ tous ses Routines supprimés

Workout ──(supprimé)──→ tous ses Exercises supprimés
Exercise ──(supprimé)──→ tous ses ExerciseSets supprimés

Routine ──(supprimé)──→ tous ses RoutineExercises supprimés
RoutineExercise ──(supprimé)──→ tous ses RoutineSets supprimés
```

Cela garantit l'intégrité référentielle : aucune donnée orpheline en base.

## Stratégie de mise à jour

Les mises à jour de séances et routines utilisent une stratégie **delete-and-recreate** au sein d'une **transaction Prisma** :

1. Suppression de tous les exercices existants (`deleteMany`)
2. Recréation avec les nouvelles données (`create`)
3. Le tout dans un `$transaction` pour garantir l'atomicité

Cette approche simplifie la logique de diff tout en garantissant la cohérence des données.

## Index

| Table | Colonne | Type | Objectif |
|-------|---------|------|----------|
| `User` | `email` | UNIQUE | Recherche par email (login) |
| Toutes | `id` | PRIMARY KEY | Accès par identifiant |

## Migrations

Les migrations sont gérées par **Prisma Migrate** et versionnées dans `server/prisma/migrations/`.

```bash
# Créer une migration après modification du schéma
npx prisma migrate dev --name description_du_changement

# Appliquer les migrations en production
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate
```
