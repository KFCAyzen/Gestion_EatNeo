import { useState, useEffect } from 'react';

interface OfflineOrder {
  id: string;
  items: any[];
  client: {
    nom: string;
    telephone: string;
  };
  localisation: string;
  total: string;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<OfflineOrder[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingOrders();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier l'état initial
    setIsOnline(navigator.onLine);

    // Charger les commandes en attente
    loadPendingOrders();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingOrders = () => {
    const stored = localStorage.getItem('pendingOrders');
    if (stored) {
      setPendingOrders(JSON.parse(stored));
    }
  };

  const saveOrderOffline = (order: OfflineOrder) => {
    const updated = [...pendingOrders, order];
    setPendingOrders(updated);
    localStorage.setItem('pendingOrders', JSON.stringify(updated));
    
    // Enregistrer pour la synchronisation en arrière-plan
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('background-sync');
      });
    }
  };

  const syncPendingOrders = async () => {
    if (pendingOrders.length === 0) return;

    try {
      for (const order of pendingOrders) {
        // Simuler l'envoi de la commande
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Commande synchronisée:', order.id);
      }
      
      // Vider les commandes en attente
      setPendingOrders([]);
      localStorage.removeItem('pendingOrders');
      
      // Notification de succès
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('EAT NEO - Synchronisation', {
          body: `${pendingOrders.length} commande(s) synchronisée(s)`,
          icon: '/icon-192x192.png'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    }
  };

  return {
    isOnline,
    pendingOrders,
    saveOrderOffline,
    syncPendingOrders
  };
}