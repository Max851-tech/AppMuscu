// Express 4 ne transmet pas au gestionnaire d'erreurs les erreurs levées dans un
// handler async : la promesse rejetée n'est pas interceptée et le processus Node
// s'arrête. Ce wrapper passe l'erreur à next(), donc au gestionnaire d'erreurs
// de app.js, qui répond 500 sans arrêter le serveur.
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next)
}
