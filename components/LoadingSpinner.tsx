'use client'

import Image from 'next/image'

interface LoadingSpinnerProps {
  text?: string;
  size?: number;
}

const LoadingSpinner = ({ text, size }: LoadingSpinnerProps) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(46, 125, 50, 0.1) 100%)',
      backdropFilter: 'blur(20px)',
      zIndex: 99999
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px',
        padding: '40px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(46, 125, 50, 0.15)',
        border: '1px solid rgba(46, 125, 50, 0.1)'
      }}>
        {/* Logo avec animation */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            position: 'relative',
            animation: 'logoFloat 3s ease-in-out infinite'
          }}>
            <Image 
              src="/logo.jpg" 
              alt="Eat Neo Logo" 
              width={60} 
              height={60}
              style={{
                borderRadius: '50%',
                boxShadow: '0 8px 25px rgba(46, 125, 50, 0.3)'
              }}
            />
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2e7d32',
            letterSpacing: '2px',
            animation: 'fadeInOut 2s ease-in-out infinite'
          }}>
            EAT NEO
          </div>
        </div>
        
        {/* Spinner moderne */}
        <div style={{
          position: 'relative',
          width: `${size || 50}px`,
          height: `${size || 50}px`
        }}>
          <div style={{
            position: 'absolute',
            width: `${size || 50}px`,
            height: `${size || 50}px`,
            borderRadius: '50%',
            border: '4px solid rgba(46, 125, 50, 0.1)',
            borderTop: '4px solid #2e7d32',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        
        {/* Texte de chargement */}
        {text && (
          <div style={{
            fontSize: '16px',
            fontWeight: '500',
            color: '#2e7d32',
            textAlign: 'center',
            opacity: 0.8
          }}>
            {text}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner