'use client'

import { useEffect, useState } from 'react'

export function useMenuSync() {
  const [newItemsCount, setNewItemsCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Écouter les messages du service worker
    const handleSWMessage = (event: MessageEvent) => {
      const { type, count } = event.data

      if (type === 'NEW_IMAGES_CACHED') {
        setNewItemsCount(count)
        console.log(`${count} nouvelles images mises en cache`)
      }
    }

    // Détecter le statut online/offline
    const handleOnline = () => {
      setIsOnline(true)
      // Déclencher la synchronisation quand on revient online
      syncMenu()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // Enregistrer les listeners
    navigator.serviceWorker?.addEventListener('message', handleSWMessage)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Vérifier le statut initial
    setIsOnline(navigator.onLine)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Fonction pour déclencher la synchronisation manuelle
  const syncMenu = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_MENU'
      })
      console.log('Synchronisation du menu demandée')
    }
  }

  // Fonction pour mettre en cache une image spécifique
  const cacheImage = (imageUrl: string) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_IMAGE',
        imageUrl: imageUrl
      })
      console.log(`Mise en cache demandée pour: ${imageUrl}`)
    }
  }

  return {
    newItemsCount,
    isOnline,
    syncMenu,
    cacheImage
  }
}