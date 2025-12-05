'use client'

import { useState, useMemo } from 'react'
import { StockManagement } from '../StockManagement'
import { PlusIcon, MinusIcon } from '../Icons'
import type { MenuItem } from '../types'

interface StockManagementViewProps {
  boissons: MenuItem[]
  plats: MenuItem[]
  stockStats: {
    boissons: { low: number; out: number; ok: number }
    plats: { low: number; out: number; ok: number }
  }
  userRole: 'admin' | 'employee'
  onUpdateStock: (collection: 'Plats' | 'Boissons', id: string, newStock: number) => Promise<void>
  onDeleteItem: (collection: 'Plats' | 'Boissons', id: string) => Promise<void>
  onInitializeStock: () => Promise<void>
  onResetLowStock: () => Promise<void>
  onExportStockReport: () => void
  onResetAppData: () => Promise<void>
  onAddBoisson: () => void
}

export function StockManagementView({
  boissons,
  plats,
  stockStats,
  userRole,
  onUpdateStock,
  onDeleteItem,
  onInitializeStock,
  onResetLowStock,
  onExportStockReport,
  onResetAppData,
  onAddBoisson
}: StockManagementViewProps) {
  const [stockView, setStockView] = useState<'boissons' | 'ingredients'>('boissons')
  const [stockSearchTerm, setStockSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all')
  const [tempStocks, setTempStocks] = useState<{[key: string]: number}>({})

  const filteredStockBoissons = useMemo(() => {
    const searchLower = stockSearchTerm.toLowerCase()
    return boissons.filter(item => {
      const matchesSearch = item.nom?.toLowerCase().includes(searchLower)
      const stockLevel = item.stock || 0
      
      let matchesFilter = true
      switch (stockFilter) {
        case 'low': matchesFilter = stockLevel <= 5 && stockLevel > 0; break
        case 'out': matchesFilter = stockLevel === 0; break
        case 'ok': matchesFilter = stockLevel > 5; break
      }
      
      return matchesSearch && matchesFilter
    })
  }, [boissons, stockSearchTerm, stockFilter])

  return (
    <div className="stock-section">
      <h2>Gestion du Stock</h2>
      
      <StockManagement
        stockView={stockView}
        setStockView={setStockView}
        stockSearchTerm={stockSearchTerm}
        setStockSearchTerm={setStockSearchTerm}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        onInitializeStock={onInitializeStock}
        onResetLowStock={onResetLowStock}
        onAddBoisson={onAddBoisson}
        onAddIngredient={() => {}}
        onExportStockReport={onExportStockReport}
        onResetAppData={onResetAppData}
        boissonsCount={boissons.length}
        lowStockCount={stockStats.boissons.low}
        outOfStockCount={stockStats.boissons.out}
        okStockCount={stockStats.boissons.ok}
      />

      {stockView === 'boissons' && (
        <>
          <h3 className="stock-section-title">Boissons ({boissons.length})</h3>
          
          <div className="stock-grid-container">
            {filteredStockBoissons.map(item => {
              const stockLevel = item.stock || 0
              const isOutOfStock = stockLevel === 0
              const isLowStock = stockLevel <= 5 && stockLevel > 0
              
              return (
                <div key={item.id} className={`stock-card-complex ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'normal-stock'}`}>
                  <div className={`stock-badge-complex ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'normal-stock'}`}>
                    {isOutOfStock ? 'Rupture' : isLowStock ? 'Faible' : 'OK'}
                  </div>
                  
                  <div className="stock-header-complex">
                    {item.image && (
                      <div className="stock-image-complex">
                        <img src={item.image} alt={item.nom} />
                      </div>
                    )}
                    <div className="stock-info-complex">
                      <h4 className="stock-title-complex">
                        {item.nom}
                      </h4>
                      <p className="stock-text-complex">
                        Stock actuel: <span className={`stock-level-complex ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'normal-stock'}`}>{stockLevel}</span> unités
                      </p>
                    </div>
                  </div>
                  
                  <div className="stock-controls-complex">
                    {userRole === 'admin' && (
                      <button 
                        type="button"
                        onClick={() => {
                          const currentStock = tempStocks[String(item.id)] ?? (item.stock || 0)
                          setTempStocks(prev => ({
                            ...prev,
                            [String(item.id)]: Math.max(0, currentStock - 1)
                          }))
                        }}
                        className="stock-btn-minus-hover"
                        title="Diminuer le stock (Admin seulement)"
                      >
                        <MinusIcon />
                      </button>
                    )}
                    
                    <input
                      type="number"
                      value={tempStocks[String(item.id)] ?? (item.stock || 0)}
                      onChange={(e) => {
                        setTempStocks(prev => ({
                          ...prev,
                          [String(item.id)]: parseInt(e.target.value) || 0
                        }))
                      }}
                      className="stock-input-complex"
                      min="0"
                      placeholder="0"
                    />
                    
                    <button 
                      type="button"
                      onClick={() => {
                        const currentStock = tempStocks[String(item.id)] ?? (item.stock || 0)
                        setTempStocks(prev => ({
                          ...prev,
                          [String(item.id)]: currentStock + 1
                        }))
                      }}
                      className="stock-btn-plus-hover"
                      title="Augmenter le stock"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  
                  <div className="stock-actions-row">
                    {tempStocks[String(item.id)] !== undefined && tempStocks[String(item.id)] !== (item.stock || 0) && (
                      <button
                        onClick={async () => {
                          const newStock = tempStocks[String(item.id)]
                          await onUpdateStock('Boissons', String(item.id), newStock)
                          setTempStocks(prev => {
                            const updated = { ...prev }
                            delete updated[String(item.id)]
                            return updated
                          })
                        }}
                        className="stock-confirm-btn"
                      >
                        Confirmer
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteItem('Boissons', String(item.id))}
                      className="ingredient-btn-delete"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}