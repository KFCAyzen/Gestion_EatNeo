import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        setRegistration(reg);
        
        // Stocker l'utilisateur pour les notifications
        if (user) {
          localStorage.setItem('notificationUser', JSON.stringify(user));
        }
      }
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && registration) {
      registration.showNotification(title, {
        icon: '/logo.jpg',
        badge: '/logo.jpg',
        tag: 'eat-neo-notification',
        ...options
      });
    }
  };

  return {
    permission,
    requestPermission,
    sendNotification,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
};