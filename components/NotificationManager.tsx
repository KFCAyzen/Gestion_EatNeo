'use client';

import { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';

export default function NotificationManager() {
  const { requestPermission, sendNotification, permission } = usePushNotifications();
  const { user } = useAuth();
  const { data: notifications } = useRealtimeCollection('notifications');

  useEffect(() => {
    if (user && permission === 'default') {
      requestPermission();
    }
  }, [user, permission, requestPermission]);

  useEffect(() => {
    if (notifications && notifications.length > 0 && permission === 'granted') {
      const latestNotification = notifications[0];
      const lastNotificationId = localStorage.getItem('lastNotificationId');
      
      if (latestNotification.id !== lastNotificationId) {
        sendNotification(latestNotification.titre, {
          body: latestNotification.message,
          data: { id: latestNotification.id }
        });
        localStorage.setItem('lastNotificationId', latestNotification.id);
      }
    }
  }, [notifications, permission, sendNotification]);

  return null;
}