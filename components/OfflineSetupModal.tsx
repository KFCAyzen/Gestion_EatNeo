'use client'

import { useState } from 'react'

interface OfflineSetupModalProps {
  onClose: () => void
}

export default function OfflineSetupModal({ onClose }: OfflineSetupModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 300)
  }

  return (
    <div className={`offline-setup-modal ${isClosing ? 'closing' : ''}`}>
      <div className="modal-content">
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#4caf50" strokeWidth="2"/>
            <path d="M9 12L11 14L15 10" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h2>Configuration Terminée !</h2>
        
        <p>
          Toutes les ressources nécessaires ont été téléchargées et mises en cache. 
          L'application EAT NEO est maintenant prête à fonctionner entièrement hors ligne.
        </p>
        
        <div className="features-list">
          <div className="feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Menu complet disponible offline
          </div>
          <div className="feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Commandes sauvegardées localement
          </div>
          <div className="feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Synchronisation automatique
          </div>
        </div>
        
        <button onClick={handleClose} className="continue-btn">
          Commencer à utiliser l'app
        </button>
      </div>

      <style jsx>{`
        .offline-setup-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease;
        }

        .offline-setup-modal.closing {
          animation: fadeOut 0.3s ease;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 40px 32px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        .offline-setup-modal.closing .modal-content {
          animation: slideDown 0.3s ease;
        }

        .success-icon {
          margin-bottom: 24px;
          animation: bounce 0.6s ease;
        }

        h2 {
          color: #2e7d32;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        p {
          color: #666;
          font-size: 16px;
          line-height: 1.5;
          margin: 0 0 24px 0;
        }

        .features-list {
          margin-bottom: 32px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          color: #333;
          font-size: 14px;
          text-align: left;
        }

        .continue-btn {
          background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .continue-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(46, 125, 50, 0.3);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideDown {
          from { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to { 
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  )
}