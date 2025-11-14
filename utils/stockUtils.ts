import { collection, getDocs, updateDoc, doc, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../components/firebase'
import { dishRecipes } from '../components/types'

export const deductIngredientsFromOrder = async (orderItems: Array<{nom: string, quantité: number}>) => {
  try {
    // Récupérer tous les ingrédients actuels
    const ingredientsSnapshot = await getDocs(collection(db, 'ingredients'))
    const ingredients = ingredientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{id: string, nom: string, quantite: number, unite: string}>

    // Calculer les déductions nécessaires
    const deductions: {[ingredientName: string]: number} = {}
    
    for (const item of orderItems) {
      // Utiliser le nom du plat sans tenir compte de l'option de prix
      const recipe = dishRecipes[item.nom]
      if (recipe) {
        for (const [ingredientName, quantity] of Object.entries(recipe)) {
          const totalNeeded = quantity * item.quantité
          deductions[ingredientName] = (deductions[ingredientName] || 0) + totalNeeded
        }
      }
    }

    // Appliquer les déductions
    for (const [ingredientName, totalDeduction] of Object.entries(deductions)) {
      const ingredient = ingredients.find(ing => ing.nom === ingredientName)
      if (ingredient) {
        const newQuantity = Math.max(0, ingredient.quantite - totalDeduction)
        
        // Mettre à jour le stock
        await updateDoc(doc(db, 'ingredients', ingredient.id), {
          quantite: newQuantity
        })

        // Enregistrer le mouvement de stock
        await addDoc(collection(db, 'mouvements_stock'), {
          item: ingredientName,
          type: 'sortie',
          quantite: totalDeduction,
          unite: ingredient.unite,
          stockAvant: ingredient.quantite,
          stockApres: newQuantity,
          description: `Consommation automatique - commande`,
          categorie: 'ingredients',
          date: Timestamp.now()
        })
      }
    }

    return true
  } catch (error) {
    console.error('Erreur lors de la déduction des ingrédients:', error)
    return false
  }
}