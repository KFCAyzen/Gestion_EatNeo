'use client'

import { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/components/firebase';

export function useNotificationCount(enabled: boolean = true) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0)
      return
    }

    let isCancelled = false;
    const notifQuery = query(collection(db, 'notifications'), where('read', '==', false));

    const refreshCount = async () => {
      try {
        const countSnapshot = await getCountFromServer(notifQuery);
        if (!isCancelled) {
          setUnreadCount(countSnapshot.data().count);
        }
      } catch {
        // Conserver la dernière valeur connue en cas de timeout/réseau instable.
      }
    };

    void refreshCount();

    // Poll léger pour réduire la charge des listeners temps réel.
    const intervalId = window.setInterval(refreshCount, 30000);

    const onVisibilityOrFocus = () => {
      if (!document.hidden) {
        void refreshCount();
      }
    };

    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [enabled]);

  return unreadCount;
}
