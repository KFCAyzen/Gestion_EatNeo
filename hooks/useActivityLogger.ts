import { addDoc, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../components/firebase';

interface LogActivity {
  action: string;
  entity: string;
  entityId: string;
  details: string;
  type: 'create' | 'update' | 'delete' | 'status_change';
}

export function useActivityLogger() {
  const logActivity = async (activity: LogActivity) => {
    try {
      await addDoc(collection(db, 'activity_logs'), {
        ...activity,
        user: 'Admin',
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du log:', error);
    }
  };

  const logNotification = async (
    type: 'stock_low' | 'stock_out' | 'new_order' | 'order_ready',
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    try {
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        type,
        title,
        message,
        source: 'useActivityLogger',
        priority,
        read: false,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la notification:', error);
    }
  };

  return { logActivity, logNotification };
}
