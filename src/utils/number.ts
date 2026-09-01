/**
 * Parse une saisie utilisateur en nombre décimal, en acceptant
 * indifféremment la virgule (clavier FR) ou le point comme séparateur.
 * Retourne 0 si la valeur n'est pas un nombre valide.
 */
export const parseDecimal = (raw: string): number => {
  const normalized = raw.replace(',', '.').trim()
  if (normalized === '') return 0
  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : 0
}
