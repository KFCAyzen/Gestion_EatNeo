import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/components/firebase';

export function useNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const notifQuery = query(
      collection(db, 'notifications'),
      where('read', '==', false)
    );
    
    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  return unreadCount;
}