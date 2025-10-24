'use client'

import React from 'react'
import MenuPage from './MenuPage'
import type { MenuItem } from './types'
import { drinksItems } from './types'
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'

type Props = {

  onAddToCart: (item: MenuItem) => void;
  category?: string;
  searchTerm?: string;
};

const BoissonsPage: React.FC<Props> = ({
  onAddToCart,
  category,
  searchTerm = '',
}) => {
  const { items, loading } = useRealtimeCollection('Boissons');
  
  // Use Firestore data if available, otherwise fallback to local data
  const source = (items.length > 0 ? items : drinksItems).filter(item => !item.masque);
  const deduped = Array.from(
    source.reduce((acc, item) => {
      const key = item.nom.trim().toLowerCase();
      if (!acc.has(key)) acc.set(key, item);
      return acc;
    }, new Map<string, MenuItem>()).values()
  );
  
  // Show loading only if still loading and no data
  if (loading && items.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #7d3837',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#7d3837', fontSize: '1rem', margin: 0 }}>Chargement des boissons...</p>
      </div>
    );
  }

  return (
    <MenuPage
      items={deduped}
      onAddToCart={onAddToCart}
      category={category}
      searchTerm={searchTerm}
    />
  );
};

export default BoissonsPage;
