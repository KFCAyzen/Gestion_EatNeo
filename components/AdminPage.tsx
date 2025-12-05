'use client'

import { useState, useMemo } from 'react'
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { useOfflineSync } from '../hooks/useOfflineSync'
import OfflineAdmin from './OfflineAdmin'
import { Toast } from './Toast'
import { Modal } from './Modal'
import { AdminTabs } from './AdminTabs'
import { LoadingSpinner } from './Icons'
import { MenuManagement } from './admin/MenuManagement'
import { OrdersManagement } from './admin/OrdersManagement'
import { StockManagementView } from './admin/StockManagementView'
import { useAdminLogic } from './admin/useAdminLogic'
import '@/styles/AdminPage.css'

interface AdminPageProps {
  userRole: 'admin' | 'employee'
}

export default function AdminPage({ userRole }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'menu' | 'commandes' | 'stock' | 'historique' | 'rentabilite'>('menu')
  const [loading, setLoading] = useState(false)
  
  const { isOnline } = useOfflineSync()
  const { items: plats } = useRealtimeCollection("Plats")
  const { items: boissons } = useRealtimeCollection("Boissons")
  
  const {
    formData,
    ingredients,
    commandes,
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
    toasts,
    modal,
    removeToast,
    closeModal
  } = useAdminLogic(userRole)

  const stockStats = useMemo(() => {
    const calculateStats = (items: any[]) => {
      let low = 0, out = 0, ok = 0
      for (const item of items) {
        const stock = item.stock || 0
        if (stock === 0) out++
        else if (stock <= 5) low++
        else ok++
      }
      return { low, out, ok }
    }
    
    return {
      boissons: calculateStats(boissons),
      plats: calculateStats(plats)
    }
  }, [boissons, plats])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <LoadingSpinner text="Initialisation du back-office..." size={50} />
        </div>
      </div>
    )
  }
  
  if (!isOnline) {
    return <OfflineAdmin />
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Back Office - Administration</h1>
      </div>
      
      <AdminTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        commandesCount={commandes.filter(c => c.statut !== 'livree').length}
        userRole={userRole}
      />

      {activeTab === 'menu' && (
        <MenuManagement
          plats={plats}
          boissons={boissons}
          ingredients={ingredients}
          onSubmit={(e) => handleSubmit(e, plats, boissons)}
          onFileSelect={handleFileSelect}
          onDrop={handleDrop}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleVisibility={toggleItemVisibility}
          formData={formData}
          onCancel={cancelEdit}
        />
      )}

      {activeTab === 'commandes' && (
        <OrdersManagement
          commandes={commandes}
          onUpdateStatus={updateCommandeStatut}
          onDeleteOrder={deleteCommande}
        />
      )}

      {activeTab === 'stock' && (
        <StockManagementView
          boissons={boissons}
          plats={plats}
          stockStats={stockStats}
          userRole={userRole}
          onUpdateStock={updateStock}
          onDeleteItem={handleDelete}
          onInitializeStock={async () => {}}
          onResetLowStock={async () => {}}
          onExportStockReport={() => {}}
          onResetAppData={async () => {}}
          onAddBoisson={() => {}}
        />
      )}

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
    </div>
  )
}