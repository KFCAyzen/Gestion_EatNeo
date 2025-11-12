'use client'

import { useState } from 'react'
import { useOfflineOrders } from '@/hooks/useOfflineOrders'
import { useOfflineSync } from '@/hooks/useOfflineSync'

export default function OfflineAdmin() {
  const { orders, updateOrderStatus } = useOfflineOrders()
  const { pendingCount, syncData, isSyncing } = useOfflineSync()
  const [activeTab, setActiveTab] = useState<'orders' | 'sync'>('orders')

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente': return '#ff9800'
      case 'en_preparation': return '#2196f3'
      case 'prete': return '#4caf50'
      case 'livree': return '#9e9e9e'
      default: return '#757575'
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        background: '#ff9800', 
        color: 'white', 
        padding: '10px 20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 5px 0' }}>Mode Administration Hors Ligne</h2>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Fonctionnalités limitées - {pendingCount} élément(s) en attente de synchronisation
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            background: activeTab === 'orders' ? '#2e7d32' : '#f5f5f5',
            color: activeTab === 'orders' ? 'white' : '#333',
            cursor: 'pointer'
          }}
        >
          Commandes ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            background: activeTab === 'sync' ? '#2e7d32' : '#f5f5f5',
            color: activeTab === 'sync' ? 'white' : '#333',
            cursor: 'pointer'
          }}
        >
          Synchronisation ({pendingCount})
        </button>
      </div>

      {activeTab === 'orders' && (
        <div>
          <h3>Commandes Locales</h3>
          {orders.length === 0 ? (
            <p>Aucune commande hors ligne</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {orders.map(order => (
                <div
                  key={order.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    background: 'white'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>{order.clientName}</h4>
                      <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                        {formatDate(order.timestamp)} • {order.localisation}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          background: getStatusColor(order.status),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          display: 'inline-block',
                          marginBottom: '5px'
                        }}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                      <p style={{ margin: '0', fontWeight: 'bold' }}>{order.total}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <strong>Articles:</strong>
                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                      {order.items.map((item, index) => (
                        <li key={index} style={{ fontSize: '14px' }}>
                          {item.nom} × {item.quantité} ({item.prix})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'en_preparation')}
                      disabled={order.status !== 'en_attente'}
                      style={{
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: '4px',
                        background: order.status !== 'en_attente' ? '#ccc' : '#2196f3',
                        color: 'white',
                        cursor: order.status !== 'en_attente' ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      En préparation
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'prete')}
                      disabled={order.status !== 'en_preparation'}
                      style={{
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: '4px',
                        background: order.status !== 'en_preparation' ? '#ccc' : '#4caf50',
                        color: 'white',
                        cursor: order.status !== 'en_preparation' ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Prête
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'livree')}
                      disabled={order.status !== 'prete'}
                      style={{
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: '4px',
                        background: order.status !== 'prete' ? '#ccc' : '#9e9e9e',
                        color: 'white',
                        cursor: order.status !== 'prete' ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Livrée
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sync' && (
        <div>
          <h3>Synchronisation</h3>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '20px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p>
              <strong>{pendingCount}</strong> élément(s) en attente de synchronisation
            </p>
            <button
              onClick={syncData}
              disabled={isSyncing || pendingCount === 0}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                background: isSyncing || pendingCount === 0 ? '#ccc' : '#2e7d32',
                color: 'white',
                cursor: isSyncing || pendingCount === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
            </button>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              La synchronisation se fait automatiquement quand la connexion revient
            </p>
          </div>
        </div>
      )}
    </div>
  )
}