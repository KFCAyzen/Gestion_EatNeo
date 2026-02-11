'use client'

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, Timestamp, deleteDoc, doc, getDocs, limit } from 'firebase/firestore';
import { db } from '../../components/firebase';
import Link from 'next/link';
import '../../styles/NotificationsPage.css';
import { useAuth } from '@/hooks/useAuth'

interface Notification {
  id: string;
  type: 'stock_low' | 'stock_out' | 'new_order' | 'order_ready';
  title: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  user: string;
  timestamp: Timestamp;
  type: 'create' | 'update' | 'delete' | 'status_change';
}

const LIST_LIMIT = 200;

const fetchNotifications = async (): Promise<Notification[]> => {
  const notifQuery = query(
    collection(db, 'notifications'),
    orderBy('timestamp', 'desc'),
    limit(LIST_LIMIT)
  );
  const snapshot = await getDocs(notifQuery);
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  })) as Notification[];
};

const fetchActivityLogs = async (): Promise<ActivityLog[]> => {
  const logsQuery = query(
    collection(db, 'activity_logs'),
    orderBy('timestamp', 'desc'),
    limit(LIST_LIMIT)
  );
  const snapshot = await getDocs(logsQuery);
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  })) as ActivityLog[];
};

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function NotificationsPage() {
  const { user } = useAuth()
  const canAccess = user?.role === 'admin' || user?.role === 'superadmin'
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'notifications' | 'logs'>('notifications');
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [logFilter, setLogFilter] = useState<'all' | 'create' | 'update' | 'delete'>('all');

  const { data: notifications = [], isPending: notificationsPending, error: notificationsError } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: canAccess,
    staleTime: 15 * 1000
  });

  const { data: logs = [], isPending: logsPending, error: logsError } = useQuery({
    queryKey: ['activity_logs'],
    queryFn: fetchActivityLogs,
    enabled: canAccess,
    staleTime: 15 * 1000
  });

  const { mutateAsync: runLogsCleanup } = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteDoc(doc(db, 'activity_logs', id))));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
    }
  });

  // Nettoyage automatique des logs anciens (31 jours)
  useEffect(() => {
    if (!canAccess) return
    const cleanupOldLogs = async () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
      
      const oldLogs = logs.filter(log => {
        if (!log.timestamp) return false;
        const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp as any);
        return logDate < thirtyOneDaysAgo;
      });

      const ids = oldLogs.map((log) => log.id);
      if (ids.length > 0) {
        try {
          await runLogsCleanup(ids);
        } catch (error) {
          console.error('Erreur lors de la suppression du log:', error);
        }
      }

      if (oldLogs.length > 0) {
        console.log(`${oldLogs.length} log(s) ancien(s) supprimé(s)`);
      }
    };

    // Exécuter le nettoyage une fois par jour
    const lastLogsCleanup = localStorage.getItem('lastLogsCleanup');
    const today = new Date().toDateString();
    
    if (lastLogsCleanup !== today && logs.length > 0) {
      cleanupOldLogs();
      localStorage.setItem('lastLogsCleanup', today);
    }
  }, [logs, canAccess, runLogsCleanup]);

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'high') return notif.priority === 'high';
    return true;
  });

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'stock_low':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'stock_out':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 9V13M12 17H12.01M12 1L3 5V11C3 16 6 20.5 12 23C18 20.5 21 16 21 11V5L12 1Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'new_order':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'order_ready':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'update':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'delete':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'status_change':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M1 4V10H7M23 20V14H17M20.49 9C19.9828 7.56678 19.1209 6.28392 17.9845 5.27493C16.8482 4.26595 15.4745 3.56905 13.9917 3.24575C12.5089 2.92246 10.9652 2.98546 9.51691 3.42597C8.06861 3.86648 6.76071 4.66897 5.71 5.75L1 10M23 14L18.29 18.25C17.2393 19.331 15.9314 20.1335 14.4831 20.574C13.0348 21.0145 11.4911 21.0775 10.0083 20.7542C8.52547 20.431 7.1518 19.7341 6.01547 18.7251C4.87913 17.7161 4.01717 16.4332 3.51 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'create': return '#10b981';
      case 'update': return '#3b82f6';
      case 'delete': return '#ef4444';
      case 'status_change': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (!canAccess) {
    return (
      <div className="notifications-container">
        <div className="notifications-header">
          <Link href="/admin" className="back-link">
            <BackIcon />
            Retour
          </Link>
          <h1>Notifications & Logs</h1>
        </div>
        <div className="notifications-empty">
          <h3>Accès réservé au personnel</h3>
          <p>Veuillez vous connecter pour accéder aux notifications.</p>
        </div>
      </div>
    )
  }

  if (notificationsPending || logsPending) {
    return (
      <div className="notifications-container">
        <div className="notifications-header">
          <Link href="/admin" className="back-link">
            <BackIcon />
            Retour
          </Link>
          <h1>Notifications & Logs</h1>
        </div>
        <div className="notifications-empty">
          <h3>Chargement...</h3>
          <p>Récupération des données en cours.</p>
        </div>
      </div>
    );
  }

  if (notificationsError || logsError) {
    return (
      <div className="notifications-container">
        <div className="notifications-header">
          <Link href="/admin" className="back-link">
            <BackIcon />
            Retour
          </Link>
          <h1>Notifications & Logs</h1>
        </div>
        <div className="notifications-empty">
          <h3>Erreur de chargement</h3>
          <p>
            {String(
              (notificationsError as Error)?.message ||
                (logsError as Error)?.message ||
                'Une erreur est survenue'
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <Link href="/admin" className="back-link">
          <BackIcon />
          Retour
        </Link>
        <h1>{activeTab === 'notifications' ? 'Notifications' : 'Logs d\'Activités'}</h1>
      </div>

      <div className="main-tabs">
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`main-tab ${activeTab === 'notifications' ? 'active' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
            <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Notifications ({notifications.length})
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`main-tab ${activeTab === 'logs' ? 'active' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Logs ({logs.length})
        </button>
      </div>

      {activeTab === 'notifications' && (
        <div className="notifications-filters">
          <button 
            onClick={() => setFilter('all')}
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          >
            Toutes ({notifications.length})
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          >
            Non lues ({notifications.filter(n => !n.read).length})
          </button>
          <button 
            onClick={() => setFilter('high')}
            className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
          >
            Priorité haute ({notifications.filter(n => n.priority === 'high').length})
          </button>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="notifications-filters">
          <button 
            onClick={() => setLogFilter('all')}
            className={`filter-btn ${logFilter === 'all' ? 'active' : ''}`}
          >
            Toutes ({logs.length})
          </button>
          <button 
            onClick={() => setLogFilter('create')}
            className={`filter-btn ${logFilter === 'create' ? 'active' : ''}`}
          >
            Créations ({logs.filter(l => l.type === 'create').length})
          </button>
          <button 
            onClick={() => setLogFilter('update')}
            className={`filter-btn ${logFilter === 'update' ? 'active' : ''}`}
          >
            Modifications ({logs.filter(l => l.type === 'update').length})
          </button>
          <button 
            onClick={() => setLogFilter('delete')}
            className={`filter-btn ${logFilter === 'delete' ? 'active' : ''}`}
          >
            Suppressions ({logs.filter(l => l.type === 'delete').length})
          </button>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Aucune notification</h3>
              <p>Vous êtes à jour !</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`notification-card ${!notification.read ? 'unread' : ''}`}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <h4>{notification.title}</h4>
                    <div 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(notification.priority) }}
                    >
                      {notification.priority}
                    </div>
                  </div>
                  <p>{notification.message}</p>
                  <span className="notification-time">
                    {notification.timestamp?.toDate().toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="notifications-list">
          {filteredLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Aucune activité</h3>
              <p>Les actions effectuées apparaîtront ici</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="notification-card">
                <div 
                  className="notification-icon"
                  style={{ backgroundColor: getActionColor(log.type) }}
                >
                  {getActionIcon(log.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <h4>{log.action}</h4>
                    <div className="priority-badge" style={{ backgroundColor: '#f0f0f0', color: '#666' }}>
                      {log.entity}
                    </div>
                  </div>
                  <p>{log.details}</p>
                  <div className="log-footer">
                    <span>Par: {log.user}</span>
                    <span className="notification-time">
                      {log.timestamp?.toDate().toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
