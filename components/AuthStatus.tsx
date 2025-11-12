'use client'

import { useAuth } from '@/hooks/useAuth'

export default function AuthStatus() {
  const { user, isOnline } = useAuth()

  if (!user) return null

  return (
    <div className="auth-status">
      <div className="auth-info">
        <span className="username">{user.username}</span>
        <span className="role">({user.role})</span>
      </div>
      
      <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
        <div className="status-dot"></div>
        <span className="status-text">
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      </div>
      
      {user.isOffline && (
        <div className="offline-warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Session offline</span>
        </div>
      )}

      <style jsx>{`
        .auth-status {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 14px;
        }

        .auth-info {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .username {
          font-weight: 600;
          color: white;
        }

        .role {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .connection-status.online {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .connection-status.offline {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .connection-status.online .status-dot {
          background: #10b981;
        }

        .connection-status.offline .status-dot {
          background: #ef4444;
        }

        .offline-warning {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #f59e0b;
          font-size: 12px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .auth-status {
            font-size: 12px;
            padding: 6px 8px;
            gap: 8px;
          }
          
          .role {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}