import { useState } from 'react';
import { PlusIcon, SearchIcon, DownloadIcon } from './Icons';

type StockFilter = 'all' | 'low' | 'out' | 'ok';

export type { StockFilter };

interface StockManagementProps {
  stockView: 'boissons' | 'ingredients';
  setStockView: (view: 'boissons' | 'ingredients') => void;
  stockSearchTerm: string;
  setStockSearchTerm: (term: string) => void;
  stockFilter: StockFilter;
  setStockFilter: (filter: StockFilter) => void;
  onInitializeStock: () => void;
  onResetLowStock: () => void;
  onAddBoisson: () => void;
  onAddIngredient: () => void;
  onExportStockReport: () => void;
  onResetAppData: () => void;
  boissonsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  okStockCount: number;

}

export const StockManagement = ({
  stockView,
  setStockView,
  stockSearchTerm,
  setStockSearchTerm,
  stockFilter,
  setStockFilter,
  onInitializeStock,
  onResetLowStock,
  onAddBoisson,
  onAddIngredient,
  onExportStockReport,
  onResetAppData,
  boissonsCount,
  lowStockCount,
  outOfStockCount,
  okStockCount,

}: StockManagementProps) => {
  return (
    <>
      {/* Statistiques du stock */}
      <div className="stock-stats-grid">
        {stockView === 'boissons' && (
          <>
            <div 
              className={`stock-stat-card clickable ${stockFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStockFilter('all')}
            >
              <h4 className="stock-stat-title">Total Boissons</h4>
              <p className="stock-stat-number blue">{boissonsCount}</p>
            </div>
            <div 
              className={`stock-stat-card clickable ${stockFilter === 'low' ? 'active' : ''}`}
              onClick={() => setStockFilter('low')}
            >
              <h4 className="stock-stat-title">Stock Faible</h4>
              <p className="stock-stat-number orange">{lowStockCount}</p>
            </div>
            <div 
              className={`stock-stat-card clickable ${stockFilter === 'out' ? 'active' : ''}`}
              onClick={() => setStockFilter('out')}
            >
              <h4 className="stock-stat-title">Rupture</h4>
              <p className="stock-stat-number red">{outOfStockCount}</p>
            </div>
            <div 
              className={`stock-stat-card clickable ${stockFilter === 'ok' ? 'active' : ''}`}
              onClick={() => setStockFilter('ok')}
            >
              <h4 className="stock-stat-title">Stock OK</h4>
              <p className="stock-stat-number green">{okStockCount}</p>
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
          <button onClick={onAddIngredient} className="stock-action-button light-green stock-action-button-flex">
            <PlusIcon />
            Ajouter ingrédient
          </button>
        )}

        <button onClick={onExportStockReport} className="stock-action-button purple stock-action-button-flex">
          <DownloadIcon />
          Exporter PDF
        </button>
        
        <button onClick={onResetAppData} className="stock-action-button red">
          Réinitialiser Données
        </button>
      </div>
    </>
  );
};