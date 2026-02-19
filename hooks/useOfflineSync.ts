'use client'

import { useState, useEffect, useCallback } from 'react'
import { auth, db } from '@/components/firebase'
import { collection, addDoc, Timestamp, doc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { orderWriteSchema, notificationWriteSchema, activityLogWriteSchema } from '@/schemas/firestore'

interface OfflineData {
  id: string
  type: 'order' | 'notification' | 'activity'
  data: any
  timestamp: number
  synced: boolean
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  // Détecter le statut de connexion
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    updateOnlineStatus()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // Charger les données en attente au démarrage
  useEffect(() => {
    const stored = localStorage.getItem('offlineData')
    if (stored) {
      setPendingSync(JSON.parse(stored))
    }
  }, [])

  // Sauvegarder les données en attente
  const saveOfflineData = useCallback((data: OfflineData[]) => {
    localStorage.setItem('offlineData', JSON.stringify(data))
    setPendingSync(data)
  }, [])

  // Ajouter des données hors ligne
  const addOfflineData = useCallback((type: OfflineData['type'], data: any) => {
    const offlineItem: OfflineData = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      synced: false
    }

    const current = JSON.parse(localStorage.getItem('offlineData') || '[]')
    const updated = [...current, offlineItem]
    saveOfflineData(updated)

    return offlineItem.id
  }, [saveOfflineData])

  // Synchroniser les données
  const syncData = useCallback(async () => {
    if (!isOnline || isSyncing || pendingSync.length === 0) return

    setIsSyncing(true)
    const syncedIds: string[] = []

    try {
      for (const item of pendingSync) {
        if (item.synced) continue

        try {
          switch (item.type) {
            case 'order':
              if (!auth.currentUser) {
                console.warn('Auth requis pour synchroniser les commandes')
                break
              }

              const { timestamp: _ts, status: _status, ...rest } = item.data || {}
              const parsedOrder = orderWriteSchema.parse({
                ...rest,
                total: item.data?.total,
                statut: item.data?.statut || item.data?.status || 'en_attente',
                clientUid: item.data?.clientUid || auth.currentUser.uid,
                source: item.data?.source || 'offline'
              })

              await addDoc(collection(db, 'commandes'), {
                ...parsedOrder,
                dateCommande: Timestamp.fromMillis(item.timestamp),
                syncedAt: Timestamp.now()
              })
              break
            case 'notification':
              const parsedNotification = notificationWriteSchema.parse({
                ...item.data,
                source: item.data?.source || 'useOfflineSync'
              })
              await setDoc(doc(collection(db, 'notifications')), {
                ...parsedNotification,
                timestamp: Timestamp.fromMillis(item.timestamp)
              })
              break
            case 'activity':
              const parsedActivity = activityLogWriteSchema.parse({
                ...item.data,
                user: item.data?.user || 'Système'
              })
              await addDoc(collection(db, 'activity_logs'), {
                ...parsedActivity,
                timestamp: Timestamp.fromMillis(item.timestamp)
              })
              break
          }
          syncedIds.push(item.id)
        } catch (error) {
          console.error(`Erreur sync ${item.type}:`, error)
        }
      }

      // Supprimer les éléments synchronisés
      const remaining = pendingSync.filter(item => !syncedIds.includes(item.id))
      saveOfflineData(remaining)

      if (syncedIds.length > 0) {
        console.log(`${syncedIds.length} élément(s) synchronisé(s)`)
      }
    } catch (error) {
      console.error('Erreur de synchronisation:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, pendingSync, saveOfflineData])

  // Synchroniser automatiquement quand on revient en ligne
  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      const timer = setTimeout(syncData, 1000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, pendingSync.length, syncData])

  // Relancer la sync quand l'utilisateur Firebase est prêt
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isOnline && pendingSync.length > 0) {
        syncData()
      }
    })

    return () => unsubscribe()
  }, [isOnline, pendingSync.length, syncData])

  return {
    isOnline,
    pendingSync,
    isSyncing,
    addOfflineData,
    syncData,
    pendingCount: pendingSync.filter(item => !item.synced).length
  }
}
