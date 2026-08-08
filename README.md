# App Muscu

Application web de suivi d'entraînements de musculation. Permet de créer, suivre et analyser ses séances avec des statistiques détaillées.

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 3 |
| **Backend** | Node.js, Express 4, ES Modules |
| **Base de données** | PostgreSQL (Neon serverless), Prisma ORM |
| **Tests** | Vitest, Testing Library, Supertest |
| **CI/CD** | GitHub Actions |
| **Déploiement** | Netlify (frontend), Render (backend), Neon (BDD) |

## Architecture

L'application suit une **architecture en couches** avec séparation frontend/backend :

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (SPA)                     │
│          React + TypeScript + Tailwind               │
│                                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  Views    │  │ Components│  │ Services (api.ts)│  │
│  │ (pages)  │  │ (Sidebar) │  │  fetch + cookies  │  │
│  └──────────┘  └───────────┘  └────────┬─────────┘  │
└────────────────────────────────────────┬────────────┘
                                         │ HTTPS / cookies HttpOnly
┌────────────────────────────────────────┴────────────┐
│                   BACKEND (API REST)                 │
│              Node.js + Express                       │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ Middleware  │  │   Routes   │  │    Utils      │  │
│  │ requireAuth│  │ auth       │  │ password.js   │  │
│  │ rateLimiter│  │ workouts   │  │ jwt.js        │  │
│  │ helmet     │  │ routines   │  │               │  │
│  └────────────┘  └──────┬─────┘  └───────────────┘  │
│                         │                            │
│               ┌─────────┴──────────┐                 │
│               │   Prisma ORM       │                 │
│               │   (couche d'accès  │                 │
│               │    aux données)    │                 │
│               └─────────┬──────────┘                 │
└─────────────────────────┬───────────────────────────┘
                          │
                ┌─────────┴──────────┐
                │   PostgreSQL       │
                │      (Neon)        │
                └────────────────────┘
```

Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour les détails complets.

## Installation

### Prérequis

- Node.js 20+
- PostgreSQL (ou compte Neon)

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

### Variables d'environnement

Créer `server/.env` :

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key-min-32-chars
APP_BASE_URL=http://localhost:5173
COOKIE_DOMAIN=
NODE_ENV=development
```

Créer `.env` à la racine (optionnel, pour le frontend) :

```env
VITE_API_URL=http://localhost:4000
```

### Docker

```bash
docker compose up -d
```

Lance le backend + une base PostgreSQL locale.

## Tests

```bash
# Frontend (23 tests)
npm test

# Backend (50 tests)
cd server && npm test
```

## Déploiement

| Service | Plateforme | URL |
|---------|-----------|-----|
| Frontend | Netlify | appmuscumaxime.netlify.app |
| Backend | Render | (Web Service Node.js) |
| Base de données | Neon | PostgreSQL serverless |

Le pipeline CI/CD GitHub Actions exécute automatiquement sur chaque PR :
1. Vérification TypeScript
2. Build frontend
3. Tests frontend + backend
4. Build image Docker

Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) section Déploiement pour les détails.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Architecture applicative détaillée
- [`docs/API.md`](docs/API.md) — Documentation complète de l'API REST
- [`docs/DATABASE.md`](docs/DATABASE.md) — Schéma et modèle de données
- [`NETLIFY.md`](NETLIFY.md) — Configuration Netlify
