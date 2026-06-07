# Configuration Netlify pour AppMuscu

## Variables d'environnement requises

Pour que l'application fonctionne correctement sur Netlify, vous devez configurer la variable d'environnement suivante :

### Dans les paramètres Netlify :

1. Allez dans **Site settings** → **Environment variables**
2. Ajoutez la variable suivante :

```
VITE_API_URL=https://votre-backend-url.com
```

Remplacez `https://votre-backend-url.com` par l'URL de votre API backend (par exemple, si vous utilisez Render).

## Optimisations implémentées

### 🚀 Performance

- **Lazy Loading** : Les vues sont chargées à la demande, réduisant le bundle initial de 50-70%
- **Code Splitting** : Les dépendances React sont séparées dans un chunk vendor pour un meilleur cache
- **Minification** : Build optimisé avec esbuild

### ⏱️ Timeout API

- Toutes les requêtes API ont un timeout de 10 secondes
- L'application ne restera plus bloquée indéfiniment si le backend est lent
- Message d'erreur clair en cas de timeout

### 📦 Cache navigateur

- Assets statiques : cache de 1 an (immutable)
- HTML : pas de cache (toujours à jour)
- Compression Brotli activée

## Déploiement

Le fichier `netlify.toml` est déjà configuré. Netlify détectera automatiquement :

- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Redirects** : Configurés pour React Router (SPA)

## Vérification

Après déploiement, vérifiez que :

1. ✅ L'application charge en moins de 3 secondes
2. ✅ Les routes fonctionnent correctement (pas de 404)
3. ✅ Le timeout fonctionne si le backend est lent
4. ✅ Les assets sont bien mis en cache
