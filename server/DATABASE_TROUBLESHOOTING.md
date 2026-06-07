# Guide de résolution - Problème de connexion base de données

## Problème

Le serveur ne peut pas se connecter à la base de données Neon :
```
Can't reach database server at `ep-still-recipe-ae30t6bd-pooler.c-2.us-east-2.aws.neon.tech:5432`
```

## Solutions implémentées

### 1. Serveur résilient ✅

Le serveur démarre maintenant **même si la base de données n'est pas accessible** :
- ✅ Démarrage non-bloquant
- 🔄 Reconnexion automatique toutes les 5 secondes
- ⚠️ Avertissements clairs dans les logs

Cela permet de continuer le développement frontend même si la base de données est temporairement indisponible.

### 2. Vérifications à faire

#### Vérifier que la base de données Neon est active

Les bases de données Neon gratuites se mettent en veille après inactivité. Pour la réveiller :

1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Sélectionnez votre projet
3. Vérifiez le statut de la base de données
4. Si elle est en veille, elle se réveillera automatiquement à la première connexion (peut prendre 10-30 secondes)

#### Vérifier le fichier `.env`

Le fichier `server/.env` doit contenir :

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="votre-secret-jwt"
NODE_ENV="development"
```

#### Vérifier la connexion réseau

Testez si vous pouvez atteindre le serveur Neon :

```powershell
# Test de connexion
Test-NetConnection -ComputerName ep-still-recipe-ae30t6bd-pooler.c-2.us-east-2.aws.neon.tech -Port 5432
```

Si la connexion échoue :
- Vérifiez votre pare-feu
- Vérifiez votre connexion internet
- Vérifiez que vous n'êtes pas derrière un proxy qui bloque le port 5432

## Redémarrer le serveur

Avec les modifications, le serveur devrait maintenant démarrer :

```bash
cd server
npm run dev
```

Vous verrez :
```
API AppMuscu prête sur 4000 (dev)
⚠️  Le serveur démarre sans connexion à la base de données
⚠️  Les requêtes API échoueront jusqu'à la reconnexion
🔄 Tentative de reconnexion à la base de données...
```

Dès que la base de données sera accessible, vous verrez :
```
✅ Connecté à la base de données
```

## Alternative : Base de données locale

Si Neon continue à poser problème, vous pouvez utiliser PostgreSQL en local :

1. Installer PostgreSQL localement
2. Créer une base de données
3. Modifier `DATABASE_URL` dans `.env` :
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/appmuscu"
   ```
4. Exécuter les migrations :
   ```bash
   npm run prisma:migrate
   ```
