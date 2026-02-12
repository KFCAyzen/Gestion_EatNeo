'use client';

import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { collection, query, orderBy, onSnapshot, where, doc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { deleteDocWithRetry } from '@/utils/firestoreDelete';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: any;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export default function NotificationManager() {
  const { requestPermission, sendNotification, permission } = usePushNotifications();
  const { user } = useAuth();
  const { isOnline, pendingCount } = useOfflineSync();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Initialiser les notifications de commandes
  useOrderNotifications();

  useEffect(() => {
    if (!user) return
    if (user && permission === 'default') {
      requestPermission();
    }
  }, [user, permission, requestPermission]);

  useEffect(() => {
    if (!user) return
    const notifQuery = query(
      collection(db, 'notifications'), 
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notificationsData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (notifications.length > 0 && permission === 'granted') {
      const latestNotification = notifications[0];
      const lastNotificationId = localStorage.getItem('lastNotificationId');
      
      if (latestNotification.id !== lastNotificationId) {
        sendNotification(latestNotification.title, {
          body: latestNotification.message,
          data: { id: latestNotification.id }
        });
        localStorage.setItem('lastNotificationId', latestNotification.id);
      }
    }
  }, [notifications, permission, sendNotification]);

  // Afficher un indicateur hors ligne si nécessaire
  useEffect(() => {
    if (!isOnline && pendingCount > 0) {
      console.log(`Mode hors ligne: ${pendingCount} commande(s) en attente`);
    }
  }, [isOnline, pendingCount]);

  // Nettoyage automatique des notifications anciennes (31 jours)
  useEffect(() => {
    const cleanupOldNotifications = async () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
      
      const oldNotifications = notifications.filter(notif => {
        if (!notif.timestamp) return false;
        const notifDate = notif.timestamp.toDate ? notif.timestamp.toDate() : new Date(notif.timestamp);
        return notifDate < thirtyOneDaysAgo;
      });

      for (const notif of oldNotifications) {
        try {
          await deleteDocWithRetry(doc(db, 'notifications', notif.id), { isOnline });
        } catch (error) {
          console.error('Erreur lors de la suppression de la notification:', error);
        }
      }

      if (oldNotifications.length > 0) {
        console.log(`${oldNotifications.length} notification(s) ancienne(s) supprimée(s)`);
      }
    };

    // Exécuter le nettoyage une fois par jour
    const lastCleanup = localStorage.getItem('lastNotificationCleanup');
    const today = new Date().toDateString();
    
    if (lastCleanup !== today && notifications.length > 0) {
      cleanupOldNotifications();
      localStorage.setItem('lastNotificationCleanup', today);
    }
  }, [notifications]);

  return null;
}
