# Justification des cardinalités

Chaque association du [MCD](mcd.png) est lue dans les deux sens. Notation Merise : (minimum, maximum) du côté de l'entité qui participe.

| Association | Côté A | Card. | Côté B | Card. |
|---|---|---|---|---|
| POSSÉDER | User | 0,N | Workout | 1,1 |
| CRÉER | User | 0,N | Routine | 1,1 |
| CONTENIR | Workout | 1,N | Exercise | 1,1 |
| COMPORTER | Exercise | 0,N | ExerciseSet | 1,1 |
| CONTENIR | Routine | 1,N | RoutineExercise | 1,1 |
| COMPORTER | RoutineExercise | 0,N | RoutineSet | 1,1 |

## Une phrase par association

**POSSÉDER (User — Workout)** : un utilisateur possède 0 à N séances, une séance appartient à 1 seul utilisateur.
- 0 : un compte qui vient d'être créé n'a encore aucune séance.
- 1,1 : `Workout.userId` est `NOT NULL` et ne référence qu'un seul `User`.

**CRÉER (User — Routine)** : un utilisateur crée 0 à N routines, une routine est créée par 1 seul utilisateur.
- 0 : les routines sont facultatives, on peut saisir une séance sans routine.
- 1,1 : `Routine.userId` est `NOT NULL`.

**CONTENIR (Workout — Exercise)** : une séance contient 1 à N exercices, un exercice appartient à 1 seule séance.
- 1 (minimum) : `POST` et `PUT /api/workouts` renvoient 400 « Ajoute au moins un exercice. » si la liste est vide. **Cette règle vient de l'API, pas de la base.** Une séance sans exercice reste techniquement possible en SQL.
- 1,1 : `Exercise.workoutId` est `NOT NULL`. Un exercice n'est pas partagé entre séances : le même mouvement fait lors de deux séances donne deux lignes `Exercise`.

**COMPORTER (Exercise — ExerciseSet)** : un exercice comporte 0 à N séries, une série appartient à 1 seul exercice.
- 0 : l'API accepte un exercice avec `sets: []`, et le front permet de supprimer toutes les séries d'un exercice.
- 1,1 : `ExerciseSet.exerciseId` est `NOT NULL`.

**CONTENIR (Routine — RoutineExercise)** : une routine contient 1 à N exercices prévus, un exercice prévu appartient à 1 seule routine.
- 1 (minimum) : `POST` et `PUT /api/routines` refusent une routine sans exercice (400). Ici aussi, la règle est appliquée par l'API, pas par la base.
- 1,1 : `RoutineExercise.routineId` est `NOT NULL`.

**COMPORTER (RoutineExercise — RoutineSet)** : un exercice prévu comporte 0 à N séries prévues, une série prévue appartient à 1 seul exercice prévu.
- 0 : comme pour les séances, l'API accepte un exercice de routine sans série.
- 1,1 : `RoutineSet.exerciseId` est `NOT NULL` et référence `RoutineExercise(id)`.

## Pourquoi aucune association entre Routine et Workout

Démarrer une séance « depuis une routine » copie le nom, la zone ciblée, les exercices et les séries de la routine dans un nouveau brouillon de séance, côté front (`handleSelectRoutine`, `src/views/WorkoutsView.tsx`). La séance enregistrée ne garde aucune référence à la routine. Conséquences :
- modifier ou supprimer une routine ne change pas les séances déjà faites (l'historique reste fidèle) ;
- on ne peut pas retrouver en base de quelle routine vient une séance.

## Pourquoi des entités distinctes pour la routine et la séance

`Routine / RoutineExercise / RoutineSet` reprennent la structure de `Workout / Exercise / ExerciseSet`. Ce sont pourtant des tables séparées : une routine est un **modèle** (ce qui est prévu), une séance est un **fait** (ce qui a été réalisé, à une `date`). Les séparer évite qu'une modification du modèle réécrive l'historique.

## Vocabulaire

| Code | Terme utilisé à l'oral |
|---|---|
| User | Utilisateur |
| Workout | Séance |
| Exercise | Exercice (d'une séance) |
| ExerciseSet | Série (d'une séance) |
| Routine | Routine (modèle de séance) |
| RoutineExercise | Exercice prévu (d'une routine) |
| RoutineSet | Série prévue (d'une routine) |
