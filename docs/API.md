# Documentation API REST — App Muscu

**Base URL** : `http://localhost:4000` (dev) / Variable `VITE_API_URL` (production)

**Authentification** : Cookie HttpOnly `auth` contenant un JWT. Envoyé automatiquement avec `credentials: 'include'`.

**Format** : JSON (`Content-Type: application/json`)

**Rate limiting** :
- Global : 100 requêtes / 15 min par IP
- Routes auth : 10 requêtes / 15 min par IP

---

## Health check

### `GET /health`

Vérifie que le serveur est opérationnel.

**Réponse** `200` :
```json
{
  "status": "ok",
  "environment": "development"
}
```

---

## Authentification — `/api/auth`

### `POST /api/auth/register`

Crée un nouveau compte utilisateur.

**Rate limit** : 10 req / 15 min

**Body** :
```json
{
  "email": "max@example.com",
  "password": "monmotdepasse",
  "name": "Max"
}
```

| Champ | Type | Requis | Validation |
|-------|------|--------|-----------|
| `email` | string | oui | Format email valide |
| `password` | string | oui | Minimum 6 caractères |
| `name` | string | non | — |

**Réponses** :

- `201` — Compte créé, cookie `auth` défini
```json
{
  "user": {
    "id": "uuid",
    "email": "max@example.com",
    "name": "Max",
    "avatarUrl": null
  }
}
```

- `400` — Validation échouée
- `409` — Email déjà utilisé

---

### `POST /api/auth/login`

Authentifie un utilisateur existant.

**Rate limit** : 10 req / 15 min

**Body** :
```json
{
  "email": "max@example.com",
  "password": "monmotdepasse"
}
```

**Réponses** :

- `200` — Connexion réussie, cookie `auth` défini
```json
{
  "user": {
    "id": "uuid",
    "email": "max@example.com",
    "name": "Max",
    "avatarUrl": null
  }
}
```

- `400` — Validation échouée
- `401` — Email ou mot de passe incorrect

---

### `POST /api/auth/logout`

Déconnecte l'utilisateur en supprimant le cookie.

**Réponse** : `204` (pas de contenu)

---

### `GET /api/auth/me`

Retourne l'utilisateur actuellement authentifié.

**Auth requise** : oui (cookie)

**Réponses** :

- `200` :
```json
{
  "id": "uuid",
  "email": "max@example.com",
  "name": "Max",
  "avatarUrl": null
}
```

- `401` — Non authentifié ou session expirée

---

### `POST /api/auth/forgot-password`

Demande un lien de réinitialisation de mot de passe.

**Rate limit** : 10 req / 15 min

**Body** :
```json
{
  "email": "max@example.com"
}
```

**Réponse** `200` (identique que l'email existe ou non — sécurité) :
```json
{
  "message": "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."
}
```

---

### `POST /api/auth/reset-password`

Réinitialise le mot de passe avec un token valide.

**Rate limit** : 10 req / 15 min

**Body** :
```json
{
  "token": "jwt-reset-token",
  "password": "nouveaumotdepasse"
}
```

**Réponses** :

- `200` — Mot de passe réinitialisé
- `400` — Token invalide, expiré, ou mot de passe trop court

---

## Séances (Workouts) — `/api/workouts`

> Toutes les routes nécessitent une authentification.

### `GET /api/workouts`

Retourne toutes les séances de l'utilisateur, triées par date décroissante.

**Réponse** `200` :
```json
[
  {
    "id": "uuid",
    "name": "Push Day",
    "date": "2026-01-15T00:00:00.000Z",
    "focusArea": "Pectoraux",
    "notes": null,
    "exercises": [
      {
        "id": "uuid",
        "name": "Bench Press",
        "sets": [
          {
            "id": "uuid",
            "reps": 10,
            "weight": 80,
            "rpe": 8,
            "notes": null
          }
        ]
      }
    ],
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  }
]
```

---

### `POST /api/workouts`

Crée une nouvelle séance.

**Body** :
```json
{
  "name": "Push Day",
  "date": "2026-01-15",
  "focusArea": "Pectoraux",
  "notes": "Bonne session",
  "exercises": [
    {
      "name": "Bench Press",
      "sets": [
        { "reps": 10, "weight": 80, "rpe": 8, "notes": "Facile" },
        { "reps": 8, "weight": 85, "rpe": 9 }
      ]
    }
  ]
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `name` | string | oui | Nom de la séance |
| `date` | string (ISO) | oui | Date de la séance |
| `focusArea` | string | non | Zone musculaire ciblée |
| `notes` | string | non | Notes libres |
| `exercises` | array | oui | Au moins 1 exercice |
| `exercises[].name` | string | oui | Nom de l'exercice |
| `exercises[].sets` | array | oui | Séries de l'exercice |
| `sets[].reps` | number | oui | Nombre de répétitions |
| `sets[].weight` | number | oui | Poids en kg |
| `sets[].rpe` | number | non | Effort perçu (1-10) |
| `sets[].notes` | string | non | Notes sur la série |

**Réponses** :

- `201` — Séance créée (retourne l'objet complet)
- `400` — Champs obligatoires manquants ou aucun exercice

---

### `PUT /api/workouts/:id`

Met à jour une séance existante. Les exercices sont recréés entièrement (delete + create dans une transaction).

**Body** : même format que POST

**Réponses** :

- `200` — Séance mise à jour
- `400` — Validation échouée
- `404` — Séance introuvable

---

### `DELETE /api/workouts/:id`

Supprime une séance et tous ses exercices/séries (cascade).

**Réponses** :

- `204` — Supprimée
- `404` — Séance introuvable

---

## Routines — `/api/routines`

> Toutes les routes nécessitent une authentification.

Les routines sont des templates de séances réutilisables. L'API est identique à celle des workouts, sans le champ `date`.

### `GET /api/routines`

Retourne toutes les routines, triées par date de création décroissante.

### `POST /api/routines`

**Body** :
```json
{
  "name": "PPL Push",
  "focusArea": "Pectoraux",
  "exercises": [
    {
      "name": "Bench Press",
      "sets": [
        { "reps": 10, "weight": 80 }
      ]
    }
  ]
}
```

| Champ | Type | Requis |
|-------|------|--------|
| `name` | string | oui |
| `focusArea` | string | non |
| `exercises` | array | oui (min 1) |

**Réponses** : `201` / `400`

### `PUT /api/routines/:id`

Met à jour une routine. **Réponses** : `200` / `400` / `404`

### `DELETE /api/routines/:id`

Supprime une routine. **Réponses** : `204` / `404`

---

## Codes d'erreur communs

| Code | Signification |
|------|--------------|
| `400` | Données invalides (validation échouée) |
| `401` | Non authentifié ou session expirée |
| `404` | Ressource introuvable |
| `409` | Conflit (email déjà utilisé) |
| `429` | Trop de requêtes (rate limit atteint) |
| `500` | Erreur interne du serveur |

Les erreurs sont retournées au format :
```json
{
  "message": "Description de l'erreur en français"
}
```
