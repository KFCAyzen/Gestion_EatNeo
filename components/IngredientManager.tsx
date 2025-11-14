'use client'

import React, { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { Ingredient, initialIngredients } from './types'
import { useNotifications } from '../hooks/useNotifications'
import { Toast } from './Toast'
import { Modal } from './Modal'
import { PlusIcon, MinusIcon, EditIcon, DeleteIcon } from './Icons'

const IngredientManager: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newIngredient, setNewIngredient] = useState({
    nom: '',
    quantite: 0,
    unite: 'portions',
    seuilAlerte: 5,
    prixUnitaire: 0
  })
  
  const { toasts, modal, showToast, removeToast, showModal, closeModal } = useNotifications()

  // Récupération temps réel des ingrédients
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

  // Initialiser les ingrédients par défaut
  const initializeIngredients = async () => {
    showModal(
      "Initialiser les ingrédients",
      "Ajouter les ingrédients par défaut ? Cela ajoutera 11 ingrédients de base.",
      "info",
      async () => {
        try {
          for (const ingredient of initialIngredients) {
            const { id, ...ingredientData } = ingredient
            await addDoc(collection(db, 'ingredients'), ingredientData)
          }
          showToast('Ingrédients initialisés avec succès !', 'success')
        } catch (error) {
          console.error('Erreur:', error)
          showToast('Erreur lors de l\'initialisation', 'error')
        }
      },
      closeModal
    )
  }

  const addIngredient = async () => {
    if (!newIngredient.nom.trim()) {
      showToast('Le nom est requis', 'warning')
      return
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'ingredients', editingId), newIngredient)
        showToast('Ingrédient modifié !', 'success')
        setEditingId(null)
      } else {
        await addDoc(collection(db, 'ingredients'), newIngredient)
        showToast('Ingrédient ajouté !', 'success')
      }
      
      setNewIngredient({ nom: '', quantite: 0, unite: 'portions', seuilAlerte: 5, prixUnitaire: 0 })
      setShowAddForm(false)
    } catch (error) {
      console.error('Erreur:', error)
      showToast('Erreur lors de l\'ajout', 'error')
    }
  }

  const updateQuantity = async (id: string, newQuantity: number) => {
    try {
      await updateDoc(doc(db, 'ingredients', id), {
        quantite: Math.max(0, newQuantity)
      })
    } catch (error) {
      console.error('Erreur:', error)
      showToast('Erreur lors de la mise à jour', 'error')
    }
  }

  const deleteIngredient = async (id: string) => {
    showModal(
      "Supprimer l'ingrédient",
      "Êtes-vous sûr de vouloir supprimer cet ingrédient ?",
      "warning",
      async () => {
        try {
          await deleteDoc(doc(db, 'ingredients', id))
          showToast('Ingrédient supprimé !', 'success')
        } catch (error) {
          console.error('Erreur:', error)
          showToast('Erreur lors de la suppression', 'error')
        }
      },
      closeModal
    )
  }

  const editIngredient = (ingredient: Ingredient) => {
    setNewIngredient({
      nom: ingredient.nom,
      quantite: ingredient.quantite,
      unite: ingredient.unite,
      seuilAlerte: ingredient.seuilAlerte,
      prixUnitaire: ingredient.prixUnitaire || 0
    })
    setEditingId(String(ingredient.id))
    setShowAddForm(true)
  }

  const getStatusColor = (ingredient: Ingredient) => {
    if (ingredient.quantite === 0) return '#f44336'
    if (ingredient.quantite <= ingredient.seuilAlerte) return '#ff9800'
    return '#4caf50'
  }

  const getStatusText = (ingredient: Ingredient) => {
    if (ingredient.quantite === 0) return 'Rupture'
    if (ingredient.quantite <= ingredient.seuilAlerte) return 'Faible'
    return 'OK'
  }

  return (
    <div className="ingredient-manager">
      <div className="ingredient-header">
        <h2>Gestion des Ingrédients</h2>
        <div className="ingredient-actions">
          {ingredients.length === 0 && (
            <button onClick={initializeIngredients} className="btn-init">
              Initialiser les ingrédients
            </button>
          )}
          <button onClick={() => setShowAddForm(true)} className="btn-add">
            <PlusIcon />
            Ajouter un ingrédient
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="ingredient-stats">
        <div className="stat-card">
          <h3>Total</h3>
          <p>{ingredients.length}</p>
        </div>
        <div className="stat-card alert">
          <h3>Stock Faible</h3>
          <p>{ingredients.filter(i => i.quantite <= i.seuilAlerte && i.quantite > 0).length}</p>
        </div>
        <div className="stat-card danger">
          <h3>Rupture</h3>
          <p>{ingredients.filter(i => i.quantite === 0).length}</p>
        </div>
      </div>

      {/* Formulaire d'ajout/modification */}
      {showAddForm && (
        <div className="ingredient-form-overlay">
          <div className="ingredient-form">
            <h3>{editingId ? 'Modifier' : 'Ajouter'} un ingrédient</h3>
            
            <input
              type="text"
              placeholder="Nom de l'ingrédient"
              value={newIngredient.nom}
              onChange={(e) => setNewIngredient({...newIngredient, nom: e.target.value})}
            />
            
            <input
              type="number"
              placeholder="Quantité"
              value={newIngredient.quantite || ''}
              onChange={(e) => setNewIngredient({...newIngredient, quantite: Number(e.target.value)})}
            />
            
            <select
              value={newIngredient.unite}
              onChange={(e) => setNewIngredient({...newIngredient, unite: e.target.value})}
            >
              <option value="portions">Portions</option>
              <option value="pièces">Pièces</option>
              <option value="sachets">Sachets</option>
              <option value="kg">Kilogrammes</option>
              <option value="L">Litres</option>
            </select>
            
            <input
              type="number"
              placeholder="Seuil d'alerte"
              value={newIngredient.seuilAlerte || ''}
              onChange={(e) => setNewIngredient({...newIngredient, seuilAlerte: Number(e.target.value)})}
            />

            <div className="form-actions">
              <button onClick={addIngredient} className="btn-save">
                {editingId ? 'Modifier' : 'Ajouter'}
              </button>
              <button 
                onClick={() => {
                  setShowAddForm(false)
                  setEditingId(null)
                  setNewIngredient({ nom: '', quantite: 0, unite: 'portions', seuilAlerte: 5, prixUnitaire: 0 })
                }} 
                className="btn-cancel"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des ingrédients */}
      <div className="ingredients-grid">
        {ingredients.map((ingredient) => (
          <div key={ingredient.id} className="ingredient-card">
            <div 
              className="ingredient-status"
              style={{ backgroundColor: getStatusColor(ingredient) }}
            >
              {getStatusText(ingredient)}
            </div>
            
            <div className="ingredient-info">
              <h4>{ingredient.nom}</h4>
              <p>{ingredient.quantite} {ingredient.unite}</p>
              <small>Seuil: {ingredient.seuilAlerte}</small>
            </div>
            
            <div className="ingredient-controls">
              <button 
                onClick={() => updateQuantity(String(ingredient.id), ingredient.quantite - 1)}
                className="btn-minus"
              >
                <MinusIcon />
              </button>
              
              <span className="quantity-display">{ingredient.quantite}</span>
              
              <button 
                onClick={() => updateQuantity(String(ingredient.id), ingredient.quantite + 1)}
                className="btn-plus"
              >
                <PlusIcon />
              </button>
            </div>
            
            <div className="ingredient-actions">
              <button onClick={() => editIngredient(ingredient)} className="btn-edit">
                <EditIcon />
              </button>
              <button onClick={() => deleteIngredient(String(ingredient.id))} className="btn-delete">
                <DeleteIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      {ingredients.length === 0 && (
        <div className="no-ingredients">
          <p>Aucun ingrédient trouvé. Cliquez sur "Initialiser les ingrédients" pour commencer.</p>
        </div>
      )}

      {/* Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      
      {modal && (
        <Modal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
          onClose={closeModal}
        />
      )}

      <style jsx>{`
        .ingredient-manager {
          padding: 20px;
        }
        
        .ingredient-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .ingredient-actions {
          display: flex;
          gap: 10px;
        }
        
        .btn-init, .btn-add {
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .btn-init {
          background: #2196f3;
          color: white;
        }
        
        .btn-add {
          background: #4caf50;
          color: white;
        }
        
        .ingredient-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          background: #f5f5f5;
        }
        
        .stat-card.alert {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
        }
        
        .stat-card.danger {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
        }
        
        .ingredient-form-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .ingredient-form {
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 400px;
          max-width: 90vw;
        }
        
        .ingredient-form input, .ingredient-form select {
          width: 100%;
          padding: 10px;
          margin: 10px 0;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        
        .btn-save, .btn-cancel {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-save {
          background: #4caf50;
          color: white;
        }
        
        .btn-cancel {
          background: #f44336;
          color: white;
        }
        
        .ingredients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
        }
        
        .ingredient-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          position: relative;
        }
        
        .ingredient-status {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 8px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: bold;
        }
        
        .ingredient-info h4 {
          margin: 0 0 5px 0;
        }
        
        .ingredient-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 10px 0;
        }
        
        .btn-minus, .btn-plus {
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .btn-minus {
          background: #f44336;
          color: white;
        }
        
        .btn-plus {
          background: #4caf50;
          color: white;
        }
        
        .quantity-display {
          font-weight: bold;
          min-width: 40px;
          text-align: center;
        }
        
        .ingredient-actions {
          display: flex;
          gap: 5px;
        }
        
        .btn-edit, .btn-delete {
          padding: 5px 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .btn-edit {
          background: #2196f3;
          color: white;
        }
        
        .btn-delete {
          background: #f44336;
          color: white;
        }
        
        .no-ingredients {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
    </div>
  )
}

export default IngredientManager