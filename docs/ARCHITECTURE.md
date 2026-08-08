# Architecture applicative — App Muscu

## Vue d'ensemble

App Muscu est une application web full-stack organisée en **architecture 3-tiers** :

1. **Couche présentation** — SPA React (Single Page Application)
2. **Couche métier** — API REST Express.js
3. **Couche données** — PostgreSQL via Prisma ORM

Le frontend et le backend sont **deux applications indépendantes** qui communiquent exclusivement via des requêtes HTTP REST avec authentification par cookies HttpOnly.

## Structure du projet

```
AppMuscu/
├── src/                          # Frontend React
│   ├── views/                    # Pages (LoginView, WorkoutsView, StatsView…)
│   ├── components/               # Composants réutilisables (Sidebar)
│   ├── services/
│   │   └── api.ts                # Couche d'accès à l'API (fetch wrapper)
│   ├── utils/                    # Utilitaires (thème, génération d'ID)
│   ├── types.ts                  # Types TypeScript partagés
│   ├── App.tsx                   # Composant racine + state management
│   └── main.tsx                  # Point d'entrée + routeur
│
├── server/                       # Backend Express
│   ├── src/
│   │   ├── index.js              # Démarrage serveur + middleware globaux
│   │   ├── app.js                # Configuration Express (testable)
│   │   ├── config.js             # Variables d'environnement
│   │   ├── prisma.js             # Client Prisma (singleton)
│   │   ├── routes/
│   │   │   ├── auth.js           # Routes authentification
│   │   │   ├── workouts.js       # Routes CRUD séances
│   │   │   └── routines.js       # Routes CRUD routines
│   │   ├── middleware/
│   │   │   ├── requireAuth.js    # Vérification JWT via cookie
│   │   │   └── rateLimiter.js    # Limitation de débit
│   │   └── utils/
│   │       ├── password.js       # Hachage bcrypt
│   │       └── jwt.js            # Signature/vérification JWT
│   ├── prisma/
│   │   └── schema.prisma         # Schéma de base de données
│   ├── tests/                    # Tests backend
│   └── Dockerfile                # Image Docker production
│
├── .github/workflows/ci.yml      # Pipeline CI/CD
├── docker-compose.yml            # Orchestration Docker
├── netlify.toml                  # Config déploiement Netlify
└── docs/                         # Documentation technique
```

## Couche présentation — Frontend React

### Choix techniques

| Choix | Justification |
|-------|---------------|
| **React 19** | Composants fonctionnels, hooks, écosystème mature |
| **TypeScript** | Typage statique, sécurité du code, autocomplétion |
| **Vite 7** | Build rapide, HMR instantané, support ESM natif |
| **Tailwind CSS 3** | Utility-first, dark mode intégré, responsive |
| **React Router v7** | Routage SPA avec lazy loading |

### Patterns utilisés

- **Container/Presentational** : `App.tsx` centralise l'état applicatif et distribue les données aux vues via props
- **Lazy loading** : les vues sont chargées à la demande (`React.lazy()` + `Suspense`) pour réduire le bundle initial
- **Code splitting** : Vite sépare React dans un chunk `react-vendor` pour optimiser le cache navigateur

### Gestion de l'état

L'état applicatif est géré via les hooks React (`useState`) dans `App.tsx` :
- `user` — utilisateur connecté
- `workouts` — liste des séances
- `routines` — liste des routines templates
- `theme` — préférence clair/sombre (persistée en localStorage)

### Routes

| Route | Vue | Protection |
|-------|-----|-----------|
| `/login` | LoginView | Publique |
| `/forgot-password` | ForgotPasswordView | Publique |
| `/reset-password` | ResetPasswordView | Publique |
| `/` | Vue principale (tabs) | Authentifié |

La vue principale utilise un système d'onglets (workouts, routines, stats, profil) géré par l'état `activeTab`.

## Couche métier — Backend Express

### Choix techniques

| Choix | Justification |
|-------|---------------|
| **Express 4** | Framework HTTP léger, middleware composables |
| **ES Modules** | Syntaxe `import/export` moderne, cohérence avec le frontend |
| **Helmet** | Headers de sécurité HTTP automatiques (CSP, HSTS, X-Frame-Options…) |
| **express-validator** | Validation des entrées utilisateur côté serveur |
| **express-rate-limit** | Protection contre les attaques par force brute |

### Architecture en couches du backend

```
Requête HTTP
    │
    ▼
┌──────────────────┐
│   Middleware      │  helmet, cors, cookieParser, rateLimiter, express.json
└────────┬─────────┘
         ▼
┌──────────────────┐
│   Routes         │  Validation des entrées (express-validator)
│                  │  Logique métier
└────────┬─────────┘
         ▼
┌──────────────────┐
│   Prisma ORM     │  Requêtes paramétrées (protection SQL injection)
└────────┬─────────┘
         ▼
┌──────────────────┐
│   PostgreSQL     │  Stockage persistant
└──────────────────┘
```

### Middleware

| Middleware | Rôle |
|-----------|------|
| `helmet` | Headers de sécurité HTTP |
| `cors` | Contrôle des origines autorisées |
| `cookieParser` | Lecture des cookies d'authentification |
| `globalLimiter` | 100 requêtes / 15 min par IP |
| `authLimiter` | 10 requêtes / 15 min sur les routes sensibles |
| `requireAuth` | Vérification du JWT dans le cookie HttpOnly |

## Sécurité

### Authentification

- **JWT (JSON Web Token)** signé avec un secret configuré en variable d'environnement
- **Transport par cookie HttpOnly** exclusivement — le token n'est jamais exposé au JavaScript côté client, ce qui empêche le vol de session par attaque XSS
- Cookie `Secure` en production (HTTPS obligatoire)
- Cookie `SameSite: None` en production (nécessaire pour le cross-site Netlify ↔ API)
- Durée de vie : 7 jours

### Protection des mots de passe

- Hachage **bcrypt** avec salt (10 rounds)
- Le hash n'est jamais renvoyé dans les réponses API (`passwordHash` exclu)

### Validation des entrées

- **express-validator** sur toutes les routes d'authentification
- **Sanitization** manuelle sur les routes workouts/routines (`parseInt`, `trim`)
- **Prisma ORM** — toutes les requêtes sont paramétrées, empêchant les injections SQL

### Rate limiting

| Cible | Limite | Fenêtre |
|-------|--------|---------|
| Global (toutes routes) | 100 requêtes | 15 minutes |
| Auth (login, register, forgot/reset password) | 10 requêtes | 15 minutes |

### Headers HTTP (Helmet)

- `Content-Security-Policy` — prévention XSS
- `X-Content-Type-Options: nosniff` — prévention MIME sniffing
- `X-Frame-Options: SAMEORIGIN` — prévention clickjacking
- `Strict-Transport-Security` — force HTTPS
- `Cross-Origin-Resource-Policy: cross-origin` — nécessaire pour le cross-origin

### Bonnes pratiques supplémentaires

- Le endpoint `forgot-password` ne révèle pas si l'email existe (réponse identique)
- Les tokens de réinitialisation expirent après 1 heure et sont invalidés après usage
- `trust proxy` activé pour le fonctionnement correct derrière un reverse proxy

## Déploiement

### Frontend — Netlify

- Build : `npm run build` → génère le dossier `dist/`
- Redirections SPA : `/* → /index.html`
- Cache immutable sur les assets statiques (1 an)
- Variable d'environnement requise : `VITE_API_URL`

### Backend — Render

Le backend est déployé sur **Render** en tant que Web Service Node.js :

- **Runtime** : Node.js 20
- **Build command** : `npm install && npx prisma generate`
- **Start command** : `node src/index.js`
- **Health check** : `GET /health`
- Variables d'environnement configurées sur Render : `DATABASE_URL`, `JWT_SECRET`, `APP_BASE_URL`, `COOKIE_DOMAIN`, `NODE_ENV=production`

Un `Dockerfile` est également disponible pour le déploiement conteneurisé (alternative ou migration future).

### Base de données — Neon

- **PostgreSQL serverless** hébergé sur Neon
- Connexion via `DATABASE_URL` (pooled connection string)
- Migrations gérées par Prisma (`npx prisma migrate deploy`)

### CI/CD — GitHub Actions

Le pipeline s'exécute sur chaque push/PR vers `master` :

```
push / PR → master
    │
    ├── Lint & Build ──→ TypeScript check + build production
    │
    ├── Tests Frontend ──→ Vitest (23 tests)
    │
    ├── Tests Backend ──→ Vitest (50 tests)
    │
    └── Docker Build ──→ Build image + vérification démarrage
         (après succès des 3 étapes précédentes)
```

## Tests

### Stratégie de test

| Type | Outil | Cible | Nombre |
|------|-------|-------|--------|
| **Unitaire** | Vitest | Utils (password, JWT, config, storage, ID) | 18 |
| **Intégration** | Vitest + Supertest | Routes API (auth, workouts, routines) | 28 |
| **Composant** | Vitest + Testing Library | Vues React (LoginView, StatsView) | 16 |
| **Build** | GitHub Actions | TypeScript + Vite build | CI |

### Exécution

```bash
# Frontend
npm test          # run une fois
npm run test:watch  # mode watch

# Backend
cd server
npm test
npm run test:watch
```
