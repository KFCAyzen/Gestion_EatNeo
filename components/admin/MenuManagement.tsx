'use client'

import { useState, useMemo } from 'react'
import { MenuForm } from '../MenuForm'
import { SearchIcon, EditIcon, DeleteIcon, EyeIcon, EyeOffIcon } from '../Icons'
import type { MenuItem } from '../types'

interface MenuManagementProps {
  plats: MenuItem[]
  boissons: MenuItem[]
  ingredients: any[]
  onSubmit: (e: React.FormEvent) => Promise<void>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  onDrop: (e: React.DragEvent<HTMLDivElement>) => Promise<void>
  onEdit: (item: MenuItem, collection: 'Plats' | 'Boissons') => void
  onDelete: (collection: 'Plats' | 'Boissons', id: string) => void
  onToggleVisibility: (collection: 'Plats' | 'Boissons', id: string, currentStatus: boolean) => void
  formData: {
    nom: string
    setNom: (value: string) => void
    description: string
    setDescription: (value: string) => void
    prix: any[]
    setPrix: (value: any[]) => void
    categorie: string
    setCategorie: (value: string) => void
    filtre: string
    setFiltre: (value: string) => void
    imageUrl: string
    uploading: boolean
    error: string | null
    editId: string | null
    recipeIngredients: any[]
    setRecipeIngredients: (value: any[]) => void
  }
  onCancel: () => void
}

export function MenuManagement({
  plats,
  boissons,
  ingredients,
  onSubmit,
  onFileSelect,
  onDrop,
  onEdit,
  onDelete,
  onToggleVisibility,
  formData,
  onCancel
}: MenuManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPlats = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    return plats.filter(item => 
      item.nom?.toLowerCase().includes(searchLower) ||
      item.filtre?.[0]?.toLowerCase().includes(searchLower)
    )
  }, [plats, searchTerm])
  
  const filteredBoissons = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    return boissons.filter(item => 
      item.nom?.toLowerCase().includes(searchLower) ||
      item.filtre?.[0]?.toLowerCase().includes(searchLower)
    )
  }, [boissons, searchTerm])

  const formatPrix = (item: MenuItem) => {
    if (typeof item.prix === "string") return item.prix
    return item.prix.map((p: any) => `${p.label ? p.label + " - " : ""}${p.value}`).join(", ")
  }

  return (
    <>
      <MenuForm
        nom={formData.nom}
        setNom={formData.setNom}
        description={formData.description}
        setDescription={formData.setDescription}
        prix={formData.prix}
        setPrix={formData.setPrix}
        categorie={formData.categorie}
        setCategorie={formData.setCategorie}
        filtre={formData.filtre}
        setFiltre={formData.setFiltre}
        imageUrl={formData.imageUrl}
        uploading={formData.uploading}
        error={formData.error}
        editId={formData.editId}
        recipeIngredients={formData.recipeIngredients}
        setRecipeIngredients={formData.setRecipeIngredients}
        availableIngredients={ingredients}
        onSubmit={onSubmit}
        onFileSelect={onFileSelect}
        onDrop={onDrop}
        onCancel={onCancel}
      />

      <div className="search-section-container">
        <div className="search-wrapper">
          <input
            type="search"
            placeholder="Rechercher un item..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input-with-icon"
          />
          <div className="search-icon-absolute">
            <SearchIcon />
          </div>
        </div>
      </div>

      <div className="debug-container">
        <p><strong>Debug:</strong> Plats: {plats.length} items | Boissons: {boissons.length} items</p>
        {plats.length === 0 && <p className="debug-text-orange">Aucun plat trouvé dans Firestore</p>}
        {boissons.length === 0 && <p className="debug-text-orange">Aucune boisson trouvée dans Firestore</p>}
      </div>

      <h2>Plats ({plats.length})</h2>
      <ul className="item-list">
        {filteredPlats.map(item => (
          <li key={item.id} className="item-card">
            {item.image && <img src={item.image} alt={item.nom} className="item-img" />}
            <div className="item-info">
              <b>{item.nom}</b> - {formatPrix(item)} <br />
              <i>Catégorie: {item.filtre?.[0]}</i>
            </div>
            <div className="item-actions-container">
              <button
                type="button"
                className="edit-button"
                onClick={() => onEdit(item, 'Plats')}
              >
                <EditIcon />
                Modifier
              </button>
              <button
                className={`visibility-button ${item.masque ? 'show' : 'hide'}`}
                onClick={() => onToggleVisibility('Plats', String(item.id), item.masque || false)}
              >
                {item.masque ? <EyeIcon /> : <EyeOffIcon />}
                {item.masque ? 'Afficher' : 'Masquer'}
              </button>
              <button
                className="delete-button"
                onClick={() => onDelete('Plats', String(item.id))}
              >
                <DeleteIcon />
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2>Boissons ({boissons.length})</h2>
      <ul className="item-list">
        {filteredBoissons.map(item => (
          <li key={item.id} className="item-card">
            {item.image && <img src={item.image} alt={item.nom} className="item-img" />}
            <div className="item-info">
              <b>{item.nom}</b> - {formatPrix(item)} <br />
              <i>Catégorie: {item.filtre?.[0]}</i>
            </div>
            <div className="item-actions-container">
              <button
                type="button"
                className="edit-button"
                onClick={() => onEdit(item, 'Boissons')}
              >
                <EditIcon />
                Modifier
              </button>
              <button
                className={`visibility-button ${item.masque ? 'show' : 'hide'}`}
                onClick={() => onToggleVisibility('Boissons', String(item.id), item.masque || false)}
              >
                {item.masque ? <EyeIcon /> : <EyeOffIcon />}
                {item.masque ? 'Afficher' : 'Masquer'}
              </button>
              <button
                className="delete-button"
                onClick={() => onDelete('Boissons', String(item.id))}
              >
                <DeleteIcon />
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}