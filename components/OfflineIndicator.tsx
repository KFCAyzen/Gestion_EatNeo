'use client';

import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function OfflineIndicator() {
  const { isOnline, pendingOrders } = useOfflineSync();

  if (isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #ff9800, #f57c00)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      zIndex: 1001,
      boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Mode hors ligne
      {pendingOrders.length > 0 && (
        <span style={{
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '10px'
        }}>
          {pendingOrders.length} en attente
        </span>
      )}
    </div>
  );
}