import { PrintIcon, ExcelIcon, WordIcon, ArrowUpIcon, ArrowDownIcon, RefreshIcon } from './Icons';
import { Timestamp } from 'firebase/firestore';

interface MouvementStock {
  id: string;
  item: string;
  type: 'entree' | 'sortie' | 'ajustement';
  quantite: number;
  unite: string;
  stockAvant: number;
  stockApres: number;
  description: string;
  date: Timestamp;
  categorie: 'boissons' | 'ingredients';
}

interface MouvementsStockProps {
  periodFilter: string;
  setPeriodFilter: (filter: string) => void;
  typeFilter: string;
  setTypeFilter: (filter: string) => void;
  filteredMouvements: MouvementStock[];
  onPrintMouvements: () => void;
  onExportToExcel: () => void;
  onExportToWord: () => void;
  formatDate: (timestamp: Timestamp) => string;
}

export const MouvementsStock = ({
  periodFilter,
  setPeriodFilter,
  typeFilter,
  setTypeFilter,
  filteredMouvements,
  onPrintMouvements,
  onExportToExcel,
  onExportToWord,
  formatDate
}: MouvementsStockProps) => {
  return (
    <>
      {/* Filtres de période */}
      <div className="mouvements-filters">
        <div className="filter-group">
          <label>Période:</label>
          <select 
            value={periodFilter} 
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="filter-select"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="all">Tout</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Type:</label>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous</option>
            <option value="boissons">Boissons</option>
            <option value="ingredients">Ingrédients</option>
          </select>
        </div>
        <div className="mouvements-actions">
          <button onClick={onPrintMouvements} className="action-btn print">
            <PrintIcon /> Imprimer
          </button>
          <button onClick={onExportToExcel} className="action-btn excel">
            <ExcelIcon /> Excel
          </button>
          <button onClick={onExportToWord} className="action-btn word">
            <WordIcon /> Word
          </button>
        </div>
      </div>

      {/* Statistiques des mouvements */}
      <div className="mouvements-stats-grid">
        <div className="mouvement-stat-card">
          <h4>Total Mouvements</h4>
          <p className="stat-number blue">{filteredMouvements.length}</p>
        </div>
        <div className="mouvement-stat-card">
          <h4>Entrées</h4>
          <p className="stat-number green">{filteredMouvements.filter(m => m.type === 'entree').length}</p>
        </div>
        <div className="mouvement-stat-card">
          <h4>Sorties</h4>
          <p className="stat-number red">{filteredMouvements.filter(m => m.type === 'sortie').length}</p>
        </div>
        <div className="mouvement-stat-card">
          <h4>Ajustements</h4>
          <p className="stat-number orange">{filteredMouvements.filter(m => m.type === 'ajustement').length}</p>
        </div>
      </div>

      {/* Liste des mouvements */}
      <div className="mouvements-list">
        {filteredMouvements.length === 0 ? (
          <div className="mouvements-empty">
            <p>Aucun mouvement de stock pour cette période</p>
          </div>
        ) : (
          filteredMouvements.map((mouvement) => (
            <div key={mouvement.id} className="mouvement-card">
              <div className="mouvement-header">
                <div className="mouvement-info">
                  <h4>{mouvement.item}</h4>
                  <p className="mouvement-date">{formatDate(mouvement.date)}</p>
                </div>
                <div className="mouvement-details">
                  <span className={`mouvement-type ${mouvement.type}`}>
                    {mouvement.type === 'entree' ? (
                      <><ArrowUpIcon /> Entrée</>
                    ) : mouvement.type === 'sortie' ? (
                      <><ArrowDownIcon /> Sortie</>
                    ) : (
                      <><RefreshIcon /> Ajustement</>
                    )}
                  </span>
                  <span className={`mouvement-quantite ${mouvement.type}`}>
                    {mouvement.type === 'entree' ? '+' : mouvement.type === 'sortie' ? '-' : ''}
                    {mouvement.quantite} {mouvement.unite}
                  </span>
                </div>
              </div>
              <div className="mouvement-description">
                <p>{mouvement.description}</p>
                <small>Stock après: {mouvement.stockApres} {mouvement.unite}</small>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};