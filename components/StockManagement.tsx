import { useState } from 'react';
import { PlusIcon, SearchIcon, DownloadIcon } from './Icons';

interface StockManagementProps {
  stockView: 'boissons' | 'ingredients';
  setStockView: (view: 'boissons' | 'ingredients') => void;
  stockSearchTerm: string;
  setStockSearchTerm: (term: string) => void;
  onInitializeStock: () => void;
  onResetLowStock: () => void;
  onAddBoisson: () => void;
  onAddIngredient: () => void;
  onInitializeBaseIngredients: () => void;
  onExportStockReport: () => void;
  boissonsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  okStockCount: number;
  ingredientsCount?: number;
  lowIngredientsCount?: number;
  okIngredientsCount?: number;
  totalUnits?: number;
}

export const StockManagement = ({
  stockView,
  setStockView,
  stockSearchTerm,
  setStockSearchTerm,
  onInitializeStock,
  onResetLowStock,
  onAddBoisson,
  onAddIngredient,
  onInitializeBaseIngredients,
  onExportStockReport,
  boissonsCount,
  lowStockCount,
  outOfStockCount,
  okStockCount,
  ingredientsCount = 0,
  lowIngredientsCount = 0,
  okIngredientsCount = 0,
  totalUnits = 0
}: StockManagementProps) => {
  return (
    <>
      {/* Statistiques du stock */}
      <div className="stock-stats-grid">
        {stockView === 'boissons' ? (
          <>
            <div className="stock-stat-card">
              <h4 className="stock-stat-title">Total Boissons</h4>
              <p className="stock-stat-number blue">{boissonsCount}</p>
            </div>
            <div className="stock-stat-card">
              <h4 className="stock-stat-title">Stock Faible</h4>
              <p className="stock-stat-number orange">{lowStockCount}</p>
            </div>
            <div className="stock-stat-card">
              <h4 className="stock-stat-title">Rupture</h4>
              <p className="stock-stat-number red">{outOfStockCount}</p>
            </div>
            <div className="stock-stat-card">
              <h4 className="stock-stat-title">Stock OK</h4>
              <p className="stock-stat-number green">{okStockCount}</p>
            </div>
          </>
        ) : (
          <>
            <div className="stock-stat-card">
              <h4 className="stock-stat-title">Total Ingrédients</h4>
              <p className="stock-stat-number blue">{ingredientsCount}</p>
            </div>
            <div className="stock-stat-card">
              <h4 className="stock-stat-title">Stock Faible</h4>
              <p className="stock-stat-number orange">{lowIngredientsCount}</p>
            </div>
            <div className="stock-stat-card">
              <h4 className="stock-stat-title">Stock OK</h4>
              <p className="stock-stat-number green">{okIngredientsCount}</p>
            </div>
            <div className="stock-stat-card">
              <h4 className="stock-stat-title">Unités Totales</h4>
              <p className="stock-stat-number purple">{totalUnits}</p>
            </div>
          </>
        )}
      </div>

      {/* Sous-onglets Stock */}
      <div className="stock-tabs-container">
        <button
          onClick={() => setStockView('boissons')}
          className={`stock-tab-button ${stockView === 'boissons' ? 'active' : 'inactive'}`}
        >
          Boissons
        </button>
        <button
          onClick={() => setStockView('ingredients')}
          className={`stock-tab-button ${stockView === 'ingredients' ? 'active' : 'inactive'}`}
        >
          Ingrédients
        </button>
      </div>

      {/* Barre de recherche pour le stock */}
      <div className="stock-search-container">
        <div className="search-wrapper">
          <input
            type="search"
            placeholder="Rechercher dans le stock..."
            value={stockSearchTerm}
            onChange={(e) => setStockSearchTerm(e.target.value)}
            className="search-input-with-icon"
            style={{ paddingLeft: '45px' }}
          />
          <div className="search-icon-absolute">
            <SearchIcon />
          </div>
        </div>
      </div>

      {/* Actions de gestion */}
      <div className="stock-actions-container">
        <button onClick={onInitializeStock} className="stock-action-button green">
          Initialiser tout (10)
        </button>
        <button onClick={onResetLowStock} className="stock-action-button orange">
          Remettre stock faible (10)
        </button>
        {stockView === 'boissons' && (
          <button onClick={onAddBoisson} className="stock-action-button light-green stock-action-button-flex">
            <PlusIcon />
            Ajouter boisson
          </button>
        )}
        {stockView === 'ingredients' && (
          <>
            <button onClick={onAddIngredient} className="stock-action-button light-green stock-action-button-flex">
              <PlusIcon />
              Ajouter ingrédient
            </button>
            <button onClick={onInitializeBaseIngredients} className="stock-action-button blue stock-action-button-flex">
              Initialiser ingrédients de base
            </button>
          </>
        )}
        <button onClick={onExportStockReport} className="stock-action-button purple stock-action-button-flex">
          <DownloadIcon />
          Exporter PDF
        </button>
      </div>
    </>
  );
};