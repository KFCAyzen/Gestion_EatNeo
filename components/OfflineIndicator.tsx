'use client'

import { useOfflineStorage } from '@/hooks/useOfflineStorage'

export default function OfflineIndicator() {
  const { isOnline } = useOfflineStorage()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50">
      Mode hors ligne - Vos données seront synchronisées à la reconnexion
    </div>
  )
}