'use client'

import React, { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import { Ingredient, initialIngredients } from './types'
import { PlusIcon, MinusIcon } from './Icons'

const IngredientsStock: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [tempQuantities, setTempQuantities] = useState<{[key: string]: number}>({})

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'ingredients'), (snapshot) => {
      const ingredientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ingredient[]
      
      setIngredients(ingredientsData)
    })

    return () => unsubscribe()
  }, [])

  const initializeIngredients = async () => {
    for (const ingredient of initialIngredients) {
      const { id, ...ingredientData } = ingredient
      await addDoc(collection(db, 'ingredients'), ingredientData)
    }
  }

  const addMissingIngredients = async () => {
    const newIngredients = [
      { nom: "Steak haché", quantite: 11, unite: "portions", seuilAlerte: 3 },
      { nom: "Brochette", quantite: 6, unite: "portions", seuilAlerte: 2 },
      { nom: "Poisson silure", quantite: 6, unite: "portions", seuilAlerte: 2 },
      { nom: "Viande de chèvre", quantite: 17, unite: "portions", seuilAlerte: 5 },
      { nom: "Silure", quantite: 6, unite: "portions", seuilAlerte: 2 }
    ]
    
    for (const ingredient of newIngredients) {
      // Vérifier si l'ingrédient existe déjà
      const exists = ingredients.some(existing => existing.nom === ingredient.nom)
      if (!exists) {
        await addDoc(collection(db, 'ingredients'), ingredient)
      }
    }
  }

  const deleteIngredient = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet ingrédient ?')) {
      await deleteDoc(doc(db, 'ingredients', id))
    }
  }

  const updateTempQuantity = (id: string, newQuantity: number) => {
    setTempQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, newQuantity)
    }))
  }

  const confirmQuantity = async (id: string) => {
    const newQuantity = tempQuantities[id]
    if (newQuantity !== undefined) {
      await updateDoc(doc(db, 'ingredients', id), {
        quantite: newQuantity
      })
      setTempQuantities(prev => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
    }
  }

  const getCurrentQuantity = (ingredient: Ingredient) => {
    return tempQuantities[String(ingredient.id)] ?? ingredient.quantite
  }

  const hasChanges = (id: string) => {
    return tempQuantities[id] !== undefined
  }

  const getStatusColor = (ingredient: Ingredient) => {
    if (ingredient.quantite === 0) return '#f44336'
    if (ingredient.quantite <= ingredient.seuilAlerte) return '#ff9800'
    return '#4caf50'
  }

  if (ingredients.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Aucun ingrédient trouvé.</p>
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button 
            onClick={initializeIngredients}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Initialiser tous les ingrédients
          </button>
          <button 
            onClick={addMissingIngredients}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Ajouter nouveaux ingrédients seulement
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Ingrédients ({ingredients.length})</h3>
        <button 
          onClick={addMissingIngredients}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Nouveaux ingrédients
        </button>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '15px',
        marginTop: '20px'
      }}>
        {ingredients.map((ingredient) => (
          <div 
            key={ingredient.id} 
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              position: 'relative'
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '4px 8px',
                borderRadius: '12px',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: getStatusColor(ingredient)
              }}
            >
              {ingredient.quantite === 0 ? 'Rupture' : 
               ingredient.quantite <= ingredient.seuilAlerte ? 'Faible' : 'OK'}
            </div>
            
            <h4 style={{ margin: '0 0 10px 0' }}>{ingredient.nom}</h4>
            <p style={{ margin: '5px 0' }}>
              {ingredient.quantite} {ingredient.unite}
            </p>
            <small style={{ color: '#666' }}>
              Seuil: {ingredient.seuilAlerte}
            </small>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              marginTop: '15px' 
            }}>
              <button 
                onClick={() => updateTempQuantity(String(ingredient.id), getCurrentQuantity(ingredient) - 1)}
                style={{
                  width: '30px',
                  height: '30px',
                  border: 'none',
                  borderRadius: '50%',
                  backgroundColor: '#f44336',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MinusIcon />
              </button>
              
              <input
                type="number"
                value={getCurrentQuantity(ingredient)}
                onChange={(e) => updateTempQuantity(String(ingredient.id), parseInt(e.target.value) || 0)}
                style={{
                  width: '60px',
                  textAlign: 'center',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '5px'
                }}
              />
              
              <button 
                onClick={() => updateTempQuantity(String(ingredient.id), getCurrentQuantity(ingredient) + 1)}
                style={{
                  width: '30px',
                  height: '30px',
                  border: 'none',
                  borderRadius: '50%',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PlusIcon />
              </button>
            </div>
            
            {hasChanges(String(ingredient.id)) && (
              <button
                onClick={() => confirmQuantity(String(ingredient.id))}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '8px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Confirmer
              </button>
            )}
            
            <button
              onClick={() => deleteIngredient(String(ingredient.id))}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '8px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IngredientsStock