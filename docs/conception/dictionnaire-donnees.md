# Dictionnaire de données

Sources : `server/prisma/schema.prisma`, `server/prisma/migrations/`, `server/src/routes/*.js`.

Colonnes :
- **Type** : type Prisma → type PostgreSQL réel (voir [mpd.sql](mpd.sql)).
- **Taille** : `TEXT` n'a pas de longueur maximale en PostgreSQL. Aucune colonne texte n'est limitée en base.
- **Contraintes BDD** : garanties par PostgreSQL.
- **Règles API** : vérifications ou transformations faites par le backend Express avant l'écriture. Elles ne sont **pas** garanties par la base.
- 🔒 : donnée personnelle au sens du RGPD (voir la section [Données personnelles](#données-personnelles)).

## User — compte utilisateur

| Champ | Type | Taille | Contraintes BDD | Règles API | Description |
|---|---|---|---|---|---|
| id | String → TEXT | 36 car. (format UUID) | PK, NOT NULL | Valeur générée par Prisma (`uuid()`, v4) | Identifiant unique de l'utilisateur |
| email 🔒 | String → TEXT | non limitée | NOT NULL, UNIQUE (`User_email_key`) | `isEmail()` (express-validator) à l'inscription, à la connexion et pour « mot de passe oublié ». Pas de normalisation de casse. | Adresse email, sert d'identifiant de connexion |
| passwordHash 🔒 | String → TEXT | 60 car. (hash bcrypt) | NOT NULL | Mot de passe d'au moins 8 caractères avant hachage. Haché par bcryptjs, sel de coût 10. | Empreinte bcrypt du mot de passe. Le mot de passe en clair n'est jamais stocké. |
| name 🔒 | String? → TEXT | non limitée | NULL autorisé | Aucune validation, facultatif à l'inscription | Nom affiché dans l'application |
| avatarUrl 🔒 | String? → TEXT | non limitée | NULL autorisé | Lu et renvoyé par `/register`, `/login` et `/me`. Aucune route ne l'écrit. | URL de l'image de profil |
| createdAt | DateTime → TIMESTAMP(3) | — | NOT NULL, DEFAULT CURRENT_TIMESTAMP | — | Date de création du compte |
| updatedAt | DateTime → TIMESTAMP(3) | — | NOT NULL | Valeur mise par Prisma (`@updatedAt`) à chaque écriture | Date de dernière modification |
| resetToken | String? → TEXT | non limitée | NULL autorisé | JWT signé (expiration 1 h) écrit par `/forgot-password`, remis à NULL par `/reset-password` | Jeton de réinitialisation du mot de passe en cours |
| resetTokenExpiry | DateTime? → TIMESTAMP(3) | — | NULL autorisé | Maintenant + 1 h, remis à NULL après réinitialisation | Date limite d'utilisation du jeton |

## Workout — séance réalisée

| Champ | Type | Taille | Contraintes BDD | Règles API | Description |
|---|---|---|---|---|---|
| id | String → TEXT | 36 car. (format UUID) | PK, NOT NULL | Générée par Prisma | Identifiant unique de la séance |
| userId | String → TEXT | 36 car. | NOT NULL, FK → User(id), ON DELETE CASCADE, ON UPDATE CASCADE | Toujours pris dans l'utilisateur authentifié (cookie), jamais dans le body | Propriétaire de la séance |
| name | String → TEXT | non limitée | NOT NULL | Obligatoire (400 sinon), espaces retirés (`trim`) | Nom de la séance |
| date | DateTime → TIMESTAMP(3) | — | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Obligatoire (400 sinon), convertie par `new Date()`. Une date invalide renvoie 400 « La date est invalide. ». | Date à laquelle la séance a été faite |
| focusArea | String? → TEXT | non limitée | NULL autorisé | `trim`, chaîne vide → NULL. Texte libre (pas de liste fermée). | Zone musculaire ciblée |
| notes | String? → TEXT | non limitée | NULL autorisé | `trim`, chaîne vide → NULL | Remarques libres sur la séance |
| createdAt | DateTime → TIMESTAMP(3) | — | NOT NULL, DEFAULT CURRENT_TIMESTAMP | — | Date de création de l'enregistrement |
| updatedAt | DateTime → TIMESTAMP(3) | — | NOT NULL | Valeur mise par Prisma (`@updatedAt`) | Date de dernière modification |

## Exercise — exercice d'une séance

| Champ | Type | Taille | Contraintes BDD | Règles API | Description |
|---|---|---|---|---|---|
| id | String → TEXT | 36 car. (format UUID) | PK, NOT NULL | Générée par Prisma | Identifiant unique de l'exercice |
| workoutId | String → TEXT | 36 car. | NOT NULL, FK → Workout(id), ON DELETE CASCADE, ON UPDATE CASCADE | Renseignée par la création imbriquée Prisma | Séance à laquelle appartient l'exercice |
| name | String → TEXT | non limitée | NOT NULL | `trim`. Les exercices au nom vide sont ignorés. Au moins un exercice par séance (400 sinon). | Nom de l'exercice (ex. développé couché) |

## ExerciseSet — série réalisée

| Champ | Type | Taille | Contraintes BDD | Règles API | Description |
|---|---|---|---|---|---|
| id | String → TEXT | 36 car. (format UUID) | PK, NOT NULL | Générée par Prisma | Identifiant unique de la série |
| exerciseId | String → TEXT | 36 car. | NOT NULL, FK → Exercise(id), ON DELETE CASCADE, ON UPDATE CASCADE | Renseignée par la création imbriquée Prisma | Exercice auquel appartient la série |
| reps | Int → INTEGER | 4 octets | NOT NULL | `parseInt`, valeur invalide → 0. Aucune borne. | Nombre de répétitions |
| weight | Float → DOUBLE PRECISION | 8 octets | NOT NULL | `parseFloat`, valeur invalide → 0. Aucune borne. | Charge en kg (unité affichée par le front) |
| rpe | Int? → INTEGER | 4 octets | NULL autorisé | Valeur absente, `null`, chaîne vide ou nombre `0` → NULL ; sinon `parseInt` (la chaîne `"0"` donne donc 0, pas NULL). Aucune borne côté API. Le front limite le champ à 0–10 et n'envoie pas 0. | Effort perçu (Rate of Perceived Exertion) |
| notes | String? → TEXT | non limitée | NULL autorisé | `trim`, chaîne vide → NULL | Remarque sur la série |

## Routine — modèle de séance réutilisable

| Champ | Type | Taille | Contraintes BDD | Règles API | Description |
|---|---|---|---|---|---|
| id | String → TEXT | 36 car. (format UUID) | PK, NOT NULL | Générée par Prisma | Identifiant unique de la routine |
| userId | String → TEXT | 36 car. | NOT NULL, FK → User(id), ON DELETE CASCADE, ON UPDATE CASCADE | Toujours pris dans l'utilisateur authentifié (cookie) | Propriétaire de la routine |
| name | String → TEXT | non limitée | NOT NULL | Obligatoire (400 sinon), `trim` | Nom de la routine |
| focusArea | String? → TEXT | non limitée | NULL autorisé | `trim`, chaîne vide → NULL. Texte libre. | Zone musculaire ciblée |
| createdAt | DateTime → TIMESTAMP(3) | — | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Sert au tri de la liste (plus récente en premier) | Date de création |
| updatedAt | DateTime → TIMESTAMP(3) | — | NOT NULL | Valeur mise par Prisma (`@updatedAt`) | Date de dernière modification |

Contrairement à `Workout`, `Routine` n'a ni `date` ni `notes`.

## RoutineExercise — exercice prévu dans une routine

| Champ | Type | Taille | Contraintes BDD | Règles API | Description |
|---|---|---|---|---|---|
| id | String → TEXT | 36 car. (format UUID) | PK, NOT NULL | Générée par Prisma | Identifiant unique |
| routineId | String → TEXT | 36 car. | NOT NULL, FK → Routine(id), ON DELETE CASCADE, ON UPDATE CASCADE | Renseignée par la création imbriquée Prisma | Routine à laquelle appartient l'exercice |
| name | String → TEXT | non limitée | NOT NULL | `trim`. Les exercices au nom vide sont ignorés. Au moins un exercice par routine (400 sinon). | Nom de l'exercice |

## RoutineSet — série prévue dans une routine

| Champ | Type | Taille | Contraintes BDD | Règles API | Description |
|---|---|---|---|---|---|
| id | String → TEXT | 36 car. (format UUID) | PK, NOT NULL | Générée par Prisma | Identifiant unique |
| exerciseId | String → TEXT | 36 car. | NOT NULL, FK → **RoutineExercise**(id), ON DELETE CASCADE, ON UPDATE CASCADE | Renseignée par la création imbriquée Prisma | Exercice de routine auquel appartient la série |
| reps | Int → INTEGER | 4 octets | NOT NULL | `parseInt`, valeur invalide → 0. Aucune borne. | Répétitions prévues |
| weight | Float → DOUBLE PRECISION | 8 octets | NOT NULL | `parseFloat`, valeur invalide → 0. Aucune borne. | Charge prévue en kg |
| rpe | Int? → INTEGER | 4 octets | NULL autorisé | Valeur absente, `null`, chaîne vide ou nombre `0` → NULL ; sinon `parseInt` (la chaîne `"0"` donne donc 0, pas NULL). Aucune borne côté API. Le front limite le champ à 0–10 et n'envoie pas 0. | Effort perçu visé |
| notes | String? → TEXT | non limitée | NULL autorisé | `trim`, chaîne vide → NULL | Remarque sur la série |

## Données personnelles

Seule la table `User` contient des données qui identifient directement une personne :

| Champ | Nature | Remarque |
|---|---|---|
| email | Identifiant direct | Sert à la connexion. Unique en base. |
| name | Identifiant direct | Facultatif. |
| avatarUrl | Peut identifier (photo) | Aucune route ne l'écrit aujourd'hui. |
| passwordHash | Donnée d'authentification | Jamais stockée en clair (bcrypt). Jamais renvoyée par l'API (`requireAuth` la retire de `req.user`). |

Les séances, routines, exercices et séries sont rattachés à un utilisateur par `userId` : ce sont des données personnelles indirectes (historique d'entraînement d'une personne).

Effacement : supprimer la ligne `User` supprime en cascade toutes ses séances et routines (`ON DELETE CASCADE`). En revanche, aucune route de l'API ne permet aujourd'hui à un utilisateur de supprimer son compte, et l'application n'a pas encore de page de politique de confidentialité.
