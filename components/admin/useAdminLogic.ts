'use client'

import { useState, useEffect, useCallback } from 'react'
import { db, storage } from '../firebase'
import { collection, addDoc, doc, deleteDoc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { uploadImageFromBrowser } from '../upLoadFirebase'
import { useNotifications } from '../../hooks/useNotifications'
import { useActivityLogger } from '../../hooks/useActivityLogger'
import { findSimilarCategory, formatPrice } from '../utils'
import { dishRecipes } from '../types'
import type { MenuItem } from '../types'

interface Ingredient {
  id: string
  nom: string
  quantite: number
  unite: string
  prixUnitaire?: number
  seuilAlerte: number
}

interface Commande {
  id: string
  items: Array<{
    nom: string
    prix: string
    quantité: number
  }>
  total: number
  clientNom: string
  clientPrenom: string
  localisation: string
  dateCommande: Timestamp
  statut: 'en_attente' | 'en_preparation' | 'prete' | 'livree'
}

export function useAdminLogic(userRole: 'admin' | 'employee') {
  type PriceOption = { label: string; value: string; selected?: boolean }
  
  // États du formulaire
  const [nom, setNom] = useState("")
  const [description, setDescription] = useState("")
  const [prix, setPrix] = useState<PriceOption[]>([])
  const [categorie, setCategorie] = useState<"plats" | "boissons" | "desserts" | string>("plats")
  const [filtre, setFiltre] = useState<string>("")
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editingCollection, setEditingCollection] = useState<"Plats" | "Boissons" | null>(null)
  const [recipeIngredients, setRecipeIngredients] = useState<{nom: string, quantite: number}[]>([])
  
  // États des données
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [commandes, setCommandes] = useState<Commande[]>([])
  
  // Hooks
  const { toasts, modal, showToast, removeToast, showModal, closeModal } = useNotifications()
  const { logActivity, logNotification } = useActivityLogger()

  // Récupération des ingrédients
  useEffect(() => {
    const q = query(collection(db, 'ingredients'), orderBy('nom', 'asc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ingredientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ingredient[]
      
      setIngredients(ingredientsData)
    })

    return () => unsubscribe()
  }, [])

  // Récupération des commandes
  useEffect(() => {
    const q = query(collection(db, 'commandes'), orderBy('dateCommande', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commandesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commande[]
      
      setCommandes(commandesData)
    })

    return () => unsubscribe()
  }, [])

  // Upload de fichier
  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadImageFromBrowser(file, filtre || "general")
      setImageUrl(url)
    } catch {
      setError("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) await uploadFile(file)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadFile(file)
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent, plats: MenuItem[], boissons: MenuItem[]) => {
    e.preventDefault()

    if (!imageUrl) return alert("Merci d'ajouter une image !")
    if (!nom.trim()) return alert("Merci de renseigner un nom !")
    if (prix.length === 0) return alert("Ajoutez au moins une option de prix !")
    if (prix.some(p => !p.value.trim())) return alert("Chaque option de prix doit avoir une valeur.")
    if (prix.length >= 2 && prix.some(p => !p.label.trim())) return alert("Le label est obligatoire quand il y a plusieurs prix.")
    if (!categorie.trim()) return alert("Merci de renseigner une catégorie !")
    if (!filtre.trim()) return alert("Merci de renseigner un filtre !")

    if (!editId) {
      const existingItems = [...plats, ...boissons]
      const duplicateItem = existingItems.find(item => 
        item.nom?.toLowerCase().trim() === nom.toLowerCase().trim()
      )
      
      if (duplicateItem) {
        return alert(`Un plat/boisson avec le nom "${nom}" existe déjà. Veuillez choisir un autre nom.`)
      }
    }

    try {
      const drinkKeywords = ['guinness', 'bière', 'vin', 'whisky', 'vodka', 'champagne', 'cocktail', 'jus', 'soda', 'boisson']
      const isAutoDetectedDrink = drinkKeywords.some(keyword => 
        filtre.toLowerCase().includes(keyword) || nom.toLowerCase().includes(keyword)
      )
      
      const collectionName: "Plats" | "Boissons" = editId 
        ? (editingCollection as any) 
        : (categorie === "boissons" || isAutoDetectedDrink ? "Boissons" : "Plats")
      
      if (collectionName === "Plats" && !description.trim()) {
        return alert("Merci de renseigner une description pour les plats !")
      }

      let finalFiltre = filtre
      if (!editId) {
        const existingCategories = [...plats, ...boissons]
          .map(item => item.filtre?.[0])
          .filter(Boolean) as string[]
        
        const similarCategory = findSimilarCategory(filtre, existingCategories)
        if (similarCategory) {
          finalFiltre = similarCategory
        }
      }

      const prixField: string | PriceOption[] = prix.length === 1 && prix[0].label === "" 
        ? formatPrice(prix[0].value)
        : prix.map(p => ({ ...p, value: formatPrice(p.value) }))

      if (editId) {
        await setDoc(
          doc(db, collectionName, editId),
          {
            nom,
            description,
            prix: prixField,
            catégorie: [finalFiltre],
            filtre: [finalFiltre],
            image: imageUrl,
            masque: false,
          },
          { merge: true }
        )
      } else {
        await addDoc(collection(db, collectionName), {
          nom,
          description,
          prix: prixField,
          catégorie: [finalFiltre],
          filtre: [finalFiltre],
          image: imageUrl,
          masque: false,
          stock: 10,
        })
      }

      await logActivity({
        action: editId ? 'Modification' : 'Ajout',
        entity: collectionName.slice(0, -1).toLowerCase(),
        entityId: editId || 'nouveau',
        details: `${editId ? 'Modification' : 'Ajout'} de "${nom}" effectué par ${userRole}`,
        type: editId ? 'update' : 'create'
      })

      showToast(editId ? "Item modifié avec succès !" : "Item ajouté avec succès !", 'success')
      resetForm()
    } catch (err) {
      console.error(err)
      alert(editId ? "Erreur lors de la modification" : "Erreur lors de l'ajout")
    }
  }

  const resetForm = () => {
    setNom("")
    setDescription("")
    setPrix([])
    setCategorie("plats")
    setFiltre("")
    setImageUrl("")
    setEditId(null)
    setEditingCollection(null)
    setRecipeIngredients([])
    setError(null)
  }

  const cancelEdit = () => {
    if (editId) {
      showModal(
        "Annuler la modification",
        "Êtes-vous sûr de vouloir annuler les modifications ? Toutes les données saisies seront perdues.",
        "warning",
        () => {
          resetForm()
          showToast('Modification annulée', 'info')
          closeModal()
        },
        closeModal
      )
    } else {
      resetForm()
    }
  }

  // Édition d'un item
  const handleEdit = (item: MenuItem, collection: 'Plats' | 'Boissons') => {
    setEditId(String(item.id))
    setEditingCollection(collection)
    setNom(item.nom || "")
    setDescription(item.description || "")
    
    if (typeof item.prix === "string") {
      setPrix([{ label: "", value: item.prix }])
    } else if (Array.isArray(item.prix)) {
      setPrix(item.prix.map(p => ({ ...p, selected: p.selected || false })))
    } else {
      setPrix([{ label: "", value: "" }])
    }
    
    setCategorie(item.catégorie?.[0] || (collection === 'Plats' ? 'plats' : 'boissons'))
    setFiltre(item.filtre?.[0] || "")
    setImageUrl(item.image || "")
    
    if (collection === 'Plats') {
      const recipeIngredients = dishRecipes[item.nom] || {}
      const ingredientsList = Object.entries(recipeIngredients).map(([nom, quantite]) => ({
        nom,
        quantite: Number(quantite)
      }))
      setRecipeIngredients(ingredientsList)
    } else {
      setRecipeIngredients([])
    }
  }

  // Suppression d'un item
  const handleDelete = async (collectionName: "Plats" | "Boissons", id: string) => {
    showModal(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cet item ? Cette action est irréversible.",
      "warning",
      async () => {
        try {
          const itemDoc = await getDoc(doc(db, collectionName, id))
          if (itemDoc.exists()) {
            const data = itemDoc.data()
            if (data.image) {
              const match = data.image.match(/o\/(.*?)\?alt=media/)
              const path = match ? decodeURIComponent(match[1]) : ""
              if (path) await deleteObject(ref(storage, path))
            }
          }
          await deleteDoc(doc(db, collectionName, id))
          showToast("Item supprimé avec succès !", 'success')
        } catch (err) {
          console.error(err)
          showToast("Erreur lors de la suppression", 'error')
        }
        closeModal()
      },
      closeModal
    )
  }

  // Masquer/afficher un item
  const toggleItemVisibility = async (collectionName: "Plats" | "Boissons", id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, collectionName, id), {
        masque: !currentStatus
      })
      showToast(`Item ${!currentStatus ? 'masqué' : 'affiché'} avec succès !`, 'success')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showToast('Erreur lors de la mise à jour', 'error')
    }
  }

  // Mise à jour du stock
  const updateStock = async (collectionName: "Plats" | "Boissons", id: string, newStock: number) => {
    const finalStock = Math.max(0, newStock)
    try {
      await updateDoc(doc(db, collectionName, id), {
        stock: finalStock
      })
      showToast('Stock mis à jour avec succès !', 'success')
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error)
      showToast('Erreur lors de la mise à jour du stock', 'error')
    }
  }

  // Mise à jour du statut de commande
  const updateCommandeStatut = async (commandeId: string, nouveauStatut: string) => {
    try {
      await updateDoc(doc(db, 'commandes', commandeId), { statut: nouveauStatut })
      showToast('Statut mis à jour avec succès !', 'success')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showToast('Erreur lors de la mise à jour du statut', 'error')
    }
  }

  // Suppression de commande
  const deleteCommande = async (commandeId: string) => {
    showModal(
      "Supprimer la commande",
      "Êtes-vous sûr de vouloir supprimer cette commande ?",
      "warning",
      async () => {
        try {
          await deleteDoc(doc(db, 'commandes', commandeId))
          showToast('Commande supprimée avec succès !', 'success')
          closeModal()
        } catch (error) {
          console.error('Erreur lors de la suppression:', error)
          showToast('Erreur lors de la suppression', 'error')
          closeModal()
        }
      },
      closeModal
    )
  }

  return {
    // États du formulaire
    formData: {
      nom, setNom,
      description, setDescription,
      prix, setPrix,
      categorie, setCategorie,
      filtre, setFiltre,
      imageUrl,
      uploading,
      error,
      editId,
      recipeIngredients, setRecipeIngredients
    },
    
    // Données
    ingredients,
    commandes,
    
    // Fonctions
    handleSubmit,
    handleFileSelect,
    handleDrop,
    handleEdit,
    handleDelete,
    toggleItemVisibility,
    updateStock,
    updateCommandeStatut,
    deleteCommande,
    cancelEdit,
    
    // Notifications
    toasts,
    modal,
    showToast,
    removeToast,
    showModal,
    closeModal
  }
}