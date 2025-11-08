import { useState } from 'react';
import { PlusIcon, SearchIcon, DownloadIcon } from './Icons';

type StockFilter = 'all' | 'low' | 'out' | 'ok';

export type { StockFilter };

interface StockManagementProps {
  stockView: 'boissons' | 'plats';
  setStockView: (view: 'boissons' | 'plats') => void;
  stockSearchTerm: string;
  setStockSearchTerm: (term: string) => void;
  stockFilter: StockFilter;
  setStockFilter: (filter: StockFilter) => void;
  onInitializeStock: () => void;
  onResetLowStock: () => void;
  onAddBoisson: () => void;
  onExportStockReport: () => void;
  boissonsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  okStockCount: number;
  platsCount: number;
  lowPlatsCount: number;
  outOfStockPlatsCount: number;
  okPlatsCount: number;
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
  onExportStockReport,
  boissonsCount,
  lowStockCount,
  outOfStockCount,
  okStockCount,
  platsCount,
  lowPlatsCount,
  outOfStockPlatsCount,
  okPlatsCount
}: StockManagementProps) => {
  return (
    <>
      {/* Statistiques du stock */}
      <div className="stock-stats-grid">
        {stockView === 'boissons' ? (
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
        ) : (
          <>
            <div 
              className={`stock-stat-card clickable ${stockFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStockFilter('all')}
            >
              <h4 className="stock-stat-title">Total Plats</h4>
              <p className="stock-stat-number blue">{platsCount}</p>
            </div>
            <div 
              className={`stock-stat-card clickable ${stockFilter === 'low' ? 'active' : ''}`}
              onClick={() => setStockFilter('low')}
            >
              <h4 className="stock-stat-title">Stock Faible</h4>
              <p className="stock-stat-number orange">{lowPlatsCount}</p>
            </div>
            <div 
              className={`stock-stat-card clickable ${stockFilter === 'out' ? 'active' : ''}`}
              onClick={() => setStockFilter('out')}
            >
              <h4 className="stock-stat-title">Rupture</h4>
              <p className="stock-stat-number red">{outOfStockPlatsCount}</p>
            </div>
            <div 
              className={`stock-stat-card clickable ${stockFilter === 'ok' ? 'active' : ''}`}
              onClick={() => setStockFilter('ok')}
            >
              <h4 className="stock-stat-title">Stock OK</h4>
              <p className="stock-stat-number green">{okPlatsCount}</p>
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
          onClick={() => setStockView('plats')}
          className={`stock-tab-button ${stockView === 'plats' ? 'active' : 'inactive'}`}
        >
          Plats
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

        <button onClick={onExportStockReport} className="stock-action-button purple stock-action-button-flex">
          <DownloadIcon />
          Exporter PDF
        </button>
      </div>
    </>
  );
};