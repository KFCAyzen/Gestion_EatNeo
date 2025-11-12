'use client'

import { useOfflineSync } from '@/hooks/useOfflineSync'

export default function SyncStatus() {
  const { isOnline, pendingCount, isSyncing, syncData } = useOfflineSync()

  if (pendingCount === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: isOnline ? '#4caf50' : '#ff9800',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      zIndex: 1001,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: isOnline ? '#fff' : '#ffeb3b',
        animation: isSyncing ? 'pulse 1s infinite' : 'none'
      }} />
      
      {isSyncing ? (
        'Synchronisation...'
      ) : isOnline ? (
        `${pendingCount} en attente`
      ) : (
        `${pendingCount} hors ligne`
      )}
      
      {isOnline && !isSyncing && (
        <button
          onClick={syncData}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Sync
        </button>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}