'use client'

import { useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/components/firebase';
import { usePushNotifications } from './usePushNotifications';

interface Order {
  id: string;
  clientPrenom?: string;
  clientNom?: string;
  clientPhone?: string;
  items: any[];
  total: number | string;
  statut: 'en_attente' | 'en_preparation' | 'prete' | 'livree';
  dateCommande: any;
}

export function useOrderNotifications() {
  const { sendNotification, permission } = usePushNotifications();

  useEffect(() => {
    if (permission !== 'granted') return;

    // Écouter les nouvelles commandes
    const ordersQuery = query(
      collection(db, 'commandes'),
      orderBy('dateCommande', 'desc')
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
    const clientName = `${order.clientPrenom || ''} ${order.clientNom || ''}`.trim() || 'Client'
    // Notification pour nouvelle commande
    sendNotification('Nouvelle commande reçue', {
      body: `Commande de ${clientName} - ${order.total}`,
      tag: 'new-order',
      data: { orderId: order.id, type: 'new_order' }
    });

    // Créer une notification dans la base de données
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'new_order',
        title: 'Nouvelle commande',
        message: `Commande de ${clientName} pour ${order.total}`,
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
    const clientName = `${order.clientPrenom || ''} ${order.clientNom || ''}`.trim() || 'Client'
    const statusMessages: Record<string, string> = {
      en_preparation: 'Commande en préparation',
      prete: 'Commande prête',
      livree: 'Commande livrée'
    };

    if (order.statut in statusMessages) {
      sendNotification(statusMessages[order.statut], {
        body: `Commande de ${clientName}`,
        tag: 'order-status',
        data: { orderId: order.id, type: 'status_change', status: order.statut }
      });

      // Créer une notification dans la base de données
      try {
      await addDoc(collection(db, 'notifications'), {
        type: 'order_status',
        title: statusMessages[order.statut],
        message: `Commande de ${clientName} - ${order.statut.replace('_', ' ')}`,
        orderId: order.id,
        read: false,
        priority: order.statut === 'prete' ? 'high' : 'medium',
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
