import { useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/components/firebase';
import { usePushNotifications } from './usePushNotifications';

interface Order {
  id: string;
  client: {
    nom: string;
    telephone: string;
  };
  items: any[];
  total: string;
  status: 'en_attente' | 'en_preparation' | 'pret' | 'livre';
  timestamp: any;
}

export function useOrderNotifications() {
  const { sendNotification, permission } = usePushNotifications();

  useEffect(() => {
    if (permission !== 'granted') return;

    // Écouter les nouvelles commandes
    const ordersQuery = query(
      collection(db, 'commandes'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = { id: change.doc.id, ...change.doc.data() } as Order;
          handleNewOrder(order);
        }
        
        if (change.type === 'modified') {
          const order = { id: change.doc.id, ...change.doc.data() } as Order;
          handleOrderStatusChange(order);
        }
      });
    });

    return () => unsubscribe();
  }, [permission, sendNotification]);

  const handleNewOrder = async (order: Order) => {
    // Notification pour nouvelle commande
    sendNotification('Nouvelle commande reçue', {
      body: `Commande de ${order.client.nom} - ${order.total}`,
      tag: 'new-order',
      data: { orderId: order.id, type: 'new_order' }
    });

    // Créer une notification dans la base de données
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'new_order',
        title: 'Nouvelle commande',
        message: `Commande de ${order.client.nom} pour ${order.total}`,
        orderId: order.id,
        read: false,
        priority: 'high',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
    }
  };

  const handleOrderStatusChange = async (order: Order) => {
    const statusMessages = {
      en_preparation: 'Commande en préparation',
      pret: 'Commande prête',
      livre: 'Commande livrée'
    };

    if (order.status in statusMessages) {
      sendNotification(statusMessages[order.status], {
        body: `Commande de ${order.client.nom}`,
        tag: 'order-status',
        data: { orderId: order.id, type: 'status_change', status: order.status }
      });

      // Créer une notification dans la base de données
      try {
        await addDoc(collection(db, 'notifications'), {
          type: 'order_status',
          title: statusMessages[order.status],
          message: `Commande de ${order.client.nom} - ${order.status.replace('_', ' ')}`,
          orderId: order.id,
          read: false,
          priority: order.status === 'pret' ? 'high' : 'medium',
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error('Erreur lors de la création de la notification:', error);
      }
    }
  };

  return {
    // Fonctions utilitaires si nécessaire
  };
}