export function nameNormalizer (name: string): string {
  const nameTrimed = name.trim()
  const nameCapitalized = nameTrimed && nameTrimed[0].toUpperCase() + nameTrimed.slice(1).toLowerCase()
  return nameCapitalized
}
