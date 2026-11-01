# AppMuscu — règles du projet

## Contexte
Projet présenté au titre RNCP37873 (CDA). Rattrapage des blocs BC01 et BC02 avant le 25/09/2027.
Tout ce qui est écrit dans le dossier projet doit correspondre exactement au code.

## Décisions de sécurité (ne jamais modifier sans me demander)
- Auth par cookie HttpOnly uniquement : pas de token dans le body, pas de Bearer
- Mot de passe : 8 caractères minimum (recommandation CNIL + rate limiting)
- Un accès à la ressource d'un autre utilisateur renvoie 404

## Règles de travail
- Ne jamais modifier l'API ou la sécurité pour faire passer un test : corriger le test et me le signaler
- Ne jamais qualifier un échec de « préexistant » ou « pas lié » sans preuve (git, logs CI)
- Lire le log exact d'une erreur avant de proposer une cause
- La CI GitHub Actions doit avoir ses 4 jobs verts avant de considérer une tâche terminée
- Après chaque modification, lister les endroits de la doc (README, docs/) à mettre à jour
- Ne rien modifier en dehors de la tâche demandée sans me demander
