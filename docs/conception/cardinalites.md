# Justification des cardinalités

Chaque association du [MCD](mcd.png) est lue dans les deux sens. Notation Merise : (minimum, maximum) du côté de l'entité qui participe.

## Règles de gestion

Les cardinalités découlent de ces règles. Chacune est vérifiable dans le code.

| N° | Règle | Où elle est appliquée |
|---|---|---|
| RG1 | Un utilisateur peut enregistrer des séances, mais n'est pas obligé d'en avoir. Chaque séance appartient à un seul utilisateur. | `Workout.userId NOT NULL` ; `userId` pris dans le cookie (`routes/workouts.js`) |
| RG2 | Un utilisateur peut créer des routines, mais n'est pas obligé d'en avoir. Chaque routine appartient à un seul utilisateur. | `Routine.userId NOT NULL` ; `routes/routines.js` |
| RG3 | Une séance contient au moins un exercice. Chaque exercice appartient à une seule séance. | API : 400 « Ajoute au moins un exercice. » (POST et PUT) ; `Exercise.workoutId NOT NULL` |
| RG4 | Un exercice de séance peut n'avoir aucune série. Chaque série appartient à un seul exercice. | API : `sets: []` accepté ; `ExerciseSet.exerciseId NOT NULL` |
| RG5 | Une routine contient au moins un exercice prévu. Chaque exercice prévu appartient à une seule routine. | API : 400 si aucun exercice (POST et PUT) ; `RoutineExercise.routineId NOT NULL` |
| RG6 | Un exercice prévu peut n'avoir aucune série prévue. Chaque série prévue appartient à un seul exercice prévu. | API : `sets: []` accepté ; `RoutineSet.exerciseId NOT NULL` |
| RG7 | Une séance créée depuis une routine en est une copie : elle ne garde aucun lien avec la routine. | Copie côté front (`handleSelectRoutine`) ; aucune clé étrangère entre `Workout` et `Routine` |
| RG8 | Un utilisateur ne voit et ne modifie que ses propres séances et routines. | `findFirst({ where: { id, userId } })`, 404 sinon |

## Tableau des cardinalités

| Association | Côté A | Card. | Côté B | Card. | Règle |
|---|---|---|---|---|---|
| POSSÉDER | User | 0,N | Workout | 1,1 | RG1 |
| CRÉER | User | 0,N | Routine | 1,1 | RG2 |
| CONTENIR | Workout | 1,N | Exercise | 1,1 | RG3 |
| COMPORTER | Exercise | 0,N | ExerciseSet | 1,1 | RG4 |
| CONTENIR | Routine | 1,N | RoutineExercise | 1,1 | RG5 |
| COMPORTER | RoutineExercise | 0,N | RoutineSet | 1,1 | RG6 |

## Une phrase par association

**POSSÉDER (User — Workout)** — RG1 : un utilisateur possède 0 à N séances, une séance appartient à 1 seul utilisateur.
- 0 : un compte qui vient d'être créé n'a encore aucune séance.
- 1,1 : `Workout.userId` est `NOT NULL` et ne référence qu'un seul `User`.

**CRÉER (User — Routine)** — RG2 : un utilisateur crée 0 à N routines, une routine est créée par 1 seul utilisateur.
- 0 : les routines sont facultatives, on peut saisir une séance sans routine.
- 1,1 : `Routine.userId` est `NOT NULL`.

**CONTENIR (Workout — Exercise)** — RG3 : une séance contient 1 à N exercices, un exercice appartient à 1 seule séance.
- 1 (minimum) : `POST` et `PUT /api/workouts` renvoient 400 « Ajoute au moins un exercice. » si la liste est vide. **Cette règle vient de l'API, pas de la base.** Une séance sans exercice reste techniquement possible en SQL.
- 1,1 : `Exercise.workoutId` est `NOT NULL`. Un exercice n'est pas partagé entre séances : le même mouvement fait lors de deux séances donne deux lignes `Exercise`.

**COMPORTER (Exercise — ExerciseSet)** — RG4 : un exercice comporte 0 à N séries, une série appartient à 1 seul exercice.
- 0 : l'API accepte un exercice avec `sets: []`, et le front permet de supprimer toutes les séries d'un exercice.
- 1,1 : `ExerciseSet.exerciseId` est `NOT NULL`.

**CONTENIR (Routine — RoutineExercise)** — RG5 : une routine contient 1 à N exercices prévus, un exercice prévu appartient à 1 seule routine.
- 1 (minimum) : `POST` et `PUT /api/routines` refusent une routine sans exercice (400). Ici aussi, la règle est appliquée par l'API, pas par la base.
- 1,1 : `RoutineExercise.routineId` est `NOT NULL`.

**COMPORTER (RoutineExercise — RoutineSet)** — RG6 : un exercice prévu comporte 0 à N séries prévues, une série prévue appartient à 1 seul exercice prévu.
- 0 : comme pour les séances, l'API accepte un exercice de routine sans série.
- 1,1 : `RoutineSet.exerciseId` est `NOT NULL` et référence `RoutineExercise(id)`.

## Pourquoi aucune association entre Routine et Workout (RG7)

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
