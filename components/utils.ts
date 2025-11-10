// Fonction pour normaliser une chaîne (supprimer accents, casse, espaces)
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/\s+/g, '') // Supprimer les espaces
    .trim()
}

// Fonction pour calculer la distance de Levenshtein
export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i] + 1,     // deletion
        matrix[j - 1][i - 1] + cost // substitution
      )
    }
  }
  
  return matrix[b.length][a.length]
}

// Fonction pour trouver la catégorie similaire
export function findSimilarCategory(newCategory: string, existingCategories: string[]): string | null {
  const normalizedNew = normalizeString(newCategory)
  
  for (const existing of existingCategories) {
    const normalizedExisting = normalizeString(existing)
    const distance = levenshteinDistance(normalizedNew, normalizedExisting)
    const maxLength = Math.max(normalizedNew.length, normalizedExisting.length)
    
    // Si la différence est <= 1 caractère ou <= 15% de la longueur
    if (distance <= 1 || distance / maxLength <= 0.15) {
      return existing
    }
  }
  
  return null
}

// Fonction pour formater le prix
export function formatPrice(price: string | number): string {
  const numericPrice = typeof price === 'string' 
    ? parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'))
    : price
    
  if (isNaN(numericPrice)) return '0 FCFA'
  
  return `${numericPrice.toLocaleString('fr-FR')} FCFA`
}