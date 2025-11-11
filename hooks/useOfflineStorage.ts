'use client'

import { useState, useEffect } from 'react'

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    updateOnlineStatus()
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const saveOfflineData = (key: string, data: any) => {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Erreur sauvegarde hors ligne:', error)
    }
  }

  const getOfflineData = (key: string) => {
    try {
      const stored = localStorage.getItem(`offline_${key}`)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Erreur lecture hors ligne:', error)
      return null
    }
  }

  const clearOfflineData = (key: string) => {
    localStorage.removeItem(`offline_${key}`)
  }

  return {
    isOnline,
    saveOfflineData,
    getOfflineData,
    clearOfflineData
  }
}