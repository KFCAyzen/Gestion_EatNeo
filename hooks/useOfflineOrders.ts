'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOfflineSync } from './useOfflineSync'
import { parseTotal } from '@/utils/orderUtils'
import { orderWriteSchema } from '@/schemas/firestore'

interface Order {
  id: string
  items: any[]
  total: number
  clientPrenom: string
  clientNom: string
  clientName?: string
  clientPhone?: string
  numeroTable: string
  localisation: string
  statut: string
  timestamp: number
  clientUid?: string
  offline?: boolean
}

export function useOfflineOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const { addOfflineData, isOnline } = useOfflineSync()

  // Charger les commandes locales
  useEffect(() => {
    const stored = localStorage.getItem('offlineOrders')
    if (stored) {
      const parsed = JSON.parse(stored) as Order[]
      const normalized = parsed.map(order => {
        const fullName = order.clientName || ''
        const parts = fullName.trim().split(/\s+/).filter(Boolean)
        const prenom = order.clientPrenom || parts[0] || 'Client'
        const nom = order.clientNom || parts.slice(1).join(' ')

        return {
          ...order,
          total: parseTotal(order.total),
          clientPrenom: prenom,
          clientNom: nom,
          statut: order.statut || (order as any).status || 'en_attente'
        }
      })
      setOrders(normalized)
    }
  }, [])

  // Sauvegarder les commandes localement
  const saveOrders = useCallback((orderList: Order[]) => {
    localStorage.setItem('offlineOrders', JSON.stringify(orderList))
    setOrders(orderList)
  }, [])

  // Créer une nouvelle commande
  const createOrder = useCallback(async (orderData: Omit<Order, 'id' | 'timestamp' | 'offline'>) => {
    const parsedOrder = orderWriteSchema.parse({
      ...orderData,
      total: orderData.total,
      statut: orderData.statut || 'en_attente',
      source: isOnline ? 'online' : 'offline'
    })

    const newOrder: Order = {
      ...parsedOrder,
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
  const updateOrderStatus = useCallback((orderId: string, statut: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, statut } : order
    )
    saveOrders(updatedOrders)

    // Log de l'activité
    addOfflineData('activity', {
      action: 'Mise à jour statut commande',
      entity: 'commande',
      entityId: orderId,
      details: `Statut changé vers: ${statut}`,
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
