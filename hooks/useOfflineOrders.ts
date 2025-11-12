'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOfflineSync } from './useOfflineSync'

interface Order {
  id: string
  items: any[]
  total: string
  clientName: string
  clientPhone: string
  localisation: string
  status: string
  timestamp: number
  offline?: boolean
}

export function useOfflineOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const { addOfflineData, isOnline } = useOfflineSync()

  // Charger les commandes locales
  useEffect(() => {
    const stored = localStorage.getItem('offlineOrders')
    if (stored) {
      setOrders(JSON.parse(stored))
    }
  }, [])

  // Sauvegarder les commandes localement
  const saveOrders = useCallback((orderList: Order[]) => {
    localStorage.setItem('offlineOrders', JSON.stringify(orderList))
    setOrders(orderList)
  }, [])

  // Créer une nouvelle commande
  const createOrder = useCallback(async (orderData: Omit<Order, 'id' | 'timestamp' | 'offline'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      offline: !isOnline
    }

    // Sauvegarder localement
    const updatedOrders = [...orders, newOrder]
    saveOrders(updatedOrders)

    // Ajouter à la queue de synchronisation
    addOfflineData('order', newOrder)

    return newOrder.id
  }, [orders, saveOrders, addOfflineData, isOnline])

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    )
    saveOrders(updatedOrders)

    // Log de l'activité
    addOfflineData('activity', {
      action: 'Mise à jour statut commande',
      entity: 'commande',
      entityId: orderId,
      details: `Statut changé vers: ${status}`,
      user: 'Système',
      type: 'status_change'
    })
  }, [orders, saveOrders, addOfflineData])

  // Supprimer les commandes synchronisées
  const clearSyncedOrders = useCallback(() => {
    if (isOnline) {
      const unsyncedOrders = orders.filter(order => order.offline)
      saveOrders(unsyncedOrders)
    }
  }, [orders, saveOrders, isOnline])

  return {
    orders,
    createOrder,
    updateOrderStatus,
    clearSyncedOrders,
    offlineOrdersCount: orders.filter(order => order.offline).length
  }
}