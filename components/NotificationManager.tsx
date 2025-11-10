'use client';

import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from './firebase';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user && permission === 'default') {
      requestPermission();
    }
  }, [user, permission, requestPermission]);

  useEffect(() => {
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
  }, []);

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

  return null;
}