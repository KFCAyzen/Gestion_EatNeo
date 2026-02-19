'use client'

import { useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/components/firebase';
import { usePushNotifications } from './usePushNotifications';
import { normalizeOrder, type Order } from '@/utils/orderUtils';
import { notificationWriteSchema } from '@/schemas/firestore';

export function useOrderNotifications() {
  const { sendNotification, permission } = usePushNotifications();
  const isInitialSnapshot = useRef(true);

  useEffect(() => {
    if (permission !== 'granted') return;
    isInitialSnapshot.current = true;

    // Écouter les nouvelles commandes
    const ordersQuery = query(
      collection(db, 'commandes'),
      orderBy('dateCommande', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      // Evite d'inonder les notifs au montage (premier snapshot = historique complet).
      if (isInitialSnapshot.current) {
        isInitialSnapshot.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = normalizeOrder(change.doc.id, change.doc.data());
          handleNewOrder(order);
        }
        
        if (change.type === 'modified') {
          const order = normalizeOrder(change.doc.id, change.doc.data());
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
      // ID déterministe: un seul événement "nouvelle commande" par commande.
      const notifRef = doc(db, 'notifications', `order_new_${order.id}`);
      const parsed = notificationWriteSchema.parse({
        type: 'new_order',
        title: 'Nouvelle commande',
        message: `Commande de ${clientName} pour ${order.total}`,
        orderId: order.id,
        source: 'useOrderNotifications:new_order',
        read: false,
        priority: 'high'
      })
      await setDoc(notifRef, {
        ...parsed,
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
        // ID déterministe: une notif max par statut et par commande.
        const notifRef = doc(db, 'notifications', `order_status_${order.id}_${order.statut}`);
        const parsed = notificationWriteSchema.parse({
          type: 'order_status',
          title: statusMessages[order.statut],
          message: `Commande de ${clientName} - ${order.statut.replace('_', ' ')}`,
          orderId: order.id,
          source: 'useOrderNotifications:status_change',
          read: false,
          priority: order.statut === 'prete' ? 'high' : 'medium'
        })
        await setDoc(notifRef, {
          ...parsed,
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
