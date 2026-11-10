# MLD — Modèle Logique de Données

Dérivé du [MCD](mcd.png) et vérifié contre `server/prisma/schema.prisma`.

Notation : la clé primaire est <u>soulignée</u>, une clé étrangère est préfixée par `#`.

## Schéma relationnel

- **User** (<u>id</u>, email, passwordHash, name, avatarUrl, createdAt, updatedAt, resetToken, resetTokenExpiry)
- **Workout** (<u>id</u>, name, date, focusArea, notes, createdAt, updatedAt, #userId)
- **Exercise** (<u>id</u>, name, #workoutId)
- **ExerciseSet** (<u>id</u>, reps, weight, rpe, notes, #exerciseId)
- **Routine** (<u>id</u>, name, focusArea, createdAt, updatedAt, #userId)
- **RoutineExercise** (<u>id</u>, name, #routineId)
- **RoutineSet** (<u>id</u>, reps, weight, rpe, notes, #exerciseId)

## Clés étrangères

| Table | Clé étrangère | Référence | Issue de l'association (MCD) |
|---|---|---|---|
| Workout | #userId | User(id) | POSSÉDER (User 0,N — Workout 1,1) |
| Routine | #userId | User(id) | CRÉER (User 0,N — Routine 1,1) |
| Exercise | #workoutId | Workout(id) | CONTENIR (Workout 1,N — Exercise 1,1) |
| ExerciseSet | #exerciseId | Exercise(id) | COMPORTER (Exercise 0,N — ExerciseSet 1,1) |
| RoutineExercise | #routineId | Routine(id) | CONTENIR (Routine 1,N — RoutineExercise 1,1) |
| RoutineSet | #exerciseId | RoutineExercise(id) | COMPORTER (RoutineExercise 0,N — RoutineSet 1,1) |

Attention : dans `RoutineSet`, la clé étrangère s'appelle `exerciseId`, comme dans `ExerciseSet`, mais elle référence `RoutineExercise(id)` et non `Exercise(id)`. Ce nom vient du schéma Prisma.

## Règles de passage MCD → MLD appliquées

1. **Chaque entité devient une table.** Son identifiant devient la clé primaire (`id`).
2. **Association binaire de type (0,N)–(1,1) ou (1,N)–(1,1)** : l'association disparaît. La table du côté **1,1** reçoit une clé étrangère vers la table du côté N. Les six associations du MCD sont toutes de ce type. Il n'y a donc **aucune table d'association**.
3. **Aucune association N–N** : aucune table de jointure n'est nécessaire.
4. Les associations ne portent aucun attribut. Aucune colonne ne leur est ajoutée.

## Ce que le MLD ne montre pas (voir MPD et dictionnaire)

- Les types physiques (`TEXT`, `INTEGER`, `DOUBLE PRECISION`, `TIMESTAMP(3)`) : voir [mpd.sql](mpd.sql) et [le dictionnaire](dictionnaire-donnees.md).
- Les actions référentielles : toutes les clés étrangères sont en `ON DELETE CASCADE ON UPDATE CASCADE` (voir [mpd.md](mpd.md)).
- Les cardinalités minimales « 1,N » de `Workout` et `Routine` (au moins un exercice) : la base ne les garantit pas, c'est l'API qui les fait respecter (voir [cardinalites.md](cardinalites.md)).
