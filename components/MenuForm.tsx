import { useState } from 'react';
import { UploadIcon, MinusIcon, Spinner, PlusIcon } from './Icons';
import { findSimilarCategory, formatPrice } from './utils';
import { initialIngredients } from './types';

interface PriceOption {
  label: string;
  value: string;
  selected?: boolean;
}

interface RecipeIngredient {
  nom: string;
  quantite: number;
}

interface MenuFormProps {
  nom: string;
  setNom: (nom: string) => void;
  description: string;
  setDescription: (description: string) => void;
  prix: PriceOption[];
  setPrix: (prix: PriceOption[]) => void;
  categorie: string;
  setCategorie: (categorie: string) => void;
  filtre: string;
  setFiltre: (filtre: string) => void;
  imageUrl: string;
  uploading: boolean;
  error: string | null;
  editId: string | null;
  recipeIngredients: RecipeIngredient[];
  setRecipeIngredients: (ingredients: RecipeIngredient[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export type { RecipeIngredient };

export const MenuForm = ({
  nom,
  setNom,
  description,
  setDescription,
  prix,
  setPrix,
  categorie,
  setCategorie,
  filtre,
  setFiltre,
  imageUrl,
  uploading,
  error,
  editId,
  recipeIngredients,
  setRecipeIngredients,
  onSubmit,
  onFileSelect,
  onDrop
}: MenuFormProps) => {
  const addPriceOption = () => setPrix([...prix, { label: "", value: "" }]);
  
  const updatePriceOption = (index: number, field: "label" | "value", val: string) => {
    const updated = [...prix];
    if (field === "value") {
      updated[index][field] = val;
    } else {
      updated[index][field] = val;
    }
    setPrix(updated);
  };
  
  const removePriceOption = (index: number) => setPrix(prix.filter((_, i) => i !== index));

  const addRecipeIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { nom: '', quantite: 1 }]);
  };

  const updateRecipeIngredient = (index: number, field: 'nom' | 'quantite', value: string | number) => {
    const updated = [...recipeIngredients];
    if (field === 'quantite') {
      updated[index][field] = Number(value) || 0;
    } else {
      updated[index][field] = value as string;
    }
    setRecipeIngredients(updated);
  };

  const removeRecipeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="form-row">
        <input
          type="text"
          placeholder="Nom"
          value={nom}
          onChange={e => setNom(e.target.value)}
          required
          className="form-input"
        />
      </div>
      
      <div className="form-row">
        <textarea
          placeholder={categorie === "boissons" ? "Description (optionnel)" : "Description"}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          required={categorie !== "boissons"}
          className="form-textarea"
        />
      </div>

      <div className="price-options-section">
        <p className="section-title">
          <strong>Prix :</strong>
        </p>
        {prix.map((opt, idx) => (
          <div key={idx} className="price-option">
            <input
              type="text"
              placeholder={prix.length >= 2 ? "Label (obligatoire)" : "Label (facultatif)"}
              value={opt.label || ""}
              onChange={e => updatePriceOption(idx, "label", e.target.value)}
              className="price-input"
              required={prix.length >= 2}
            />
            <input
              type="text"
              placeholder="Valeur"
              value={opt.value || ""}
              onChange={e => updatePriceOption(idx, "value", e.target.value)}
              className="price-input"
            />
            <button type="button" onClick={() => removePriceOption(idx)} className="remove-price-btn">
              <MinusIcon />
            </button>
          </div>
        ))}
        <button type="button" onClick={addPriceOption} className="add-price-btn">
          Ajouter une option de prix
        </button>
      </div>

      <div className="form-row-group">
        <div className="form-field">
          <label className="field-label">
            <strong>Collection :</strong>
          </label>
          <select value={categorie} onChange={e => setCategorie(e.target.value)} className="form-select">
            <option value="plats">Plats</option>
            <option value="boissons">Boissons</option>
          </select>
        </div>

        <div className="form-field">
          <label className="field-label">
            <strong>Catégorie/Filtre :</strong>
          </label>
          <input
            type="text"
            placeholder="Ex : Entrées, Plats principaux, Desserts..."
            value={filtre}
            onChange={e => setFiltre(e.target.value)}
            required
            className="form-input"
          />
        </div>
      </div>

      {/* Section Ingrédients - uniquement pour les plats */}
      {categorie === 'plats' && (
        <div className="ingredients-section">
          <p className="section-title">
            <strong>Ingrédients nécessaires (optionnel) :</strong>
          </p>
          {recipeIngredients.map((ingredient, idx) => (
            <div key={idx} className="ingredient-row">
              <select
                value={ingredient.nom}
                onChange={e => updateRecipeIngredient(idx, 'nom', e.target.value)}
                className="ingredient-select"
              >
                <option value="">Sélectionner un ingrédient</option>
                {initialIngredients.map(ing => (
                  <option key={ing.id} value={ing.nom}>{ing.nom}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantité"
                value={ingredient.quantite}
                onChange={e => updateRecipeIngredient(idx, 'quantite', e.target.value)}
                className="ingredient-quantity"
                min="0"
                step="0.1"
              />
              <button 
                type="button" 
                onClick={() => removeRecipeIngredient(idx)} 
                className="remove-ingredient-btn"
              >
                <MinusIcon />
              </button>
            </div>
          ))}
          <button type="button" onClick={addRecipeIngredient} className="add-ingredient-btn">
            <PlusIcon />
            Ajouter un ingrédient
          </button>
        </div>
      )}

      <div
        className={`drop-zone-container ${uploading ? "uploading" : ""}`}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <UploadIcon />
        {uploading && <Spinner size={20} />}
        <span className="drop-zone-text">
          {uploading ? "Upload en cours..." : "Glissez-déposez une image ou cliquez"}
        </span>
        <input
          type="file"
          id="fileInput"
          accept="image/*"
          className="file-input-hidden"
          onChange={onFileSelect}
        />
      </div>

      {imageUrl && (
        <div className="preview-container">
          <img src={imageUrl} alt="Aperçu" className="preview-image" />
        </div>
      )}
      {error && <p className="error-text">{error}</p>}

      <button type="submit" disabled={uploading} className="submit-button">
        {uploading && <Spinner size={16} color="white" />}
        {uploading ? "Upload..." : editId ? "Modifier" : "Ajouter"}
      </button>
    </form>
  );
};