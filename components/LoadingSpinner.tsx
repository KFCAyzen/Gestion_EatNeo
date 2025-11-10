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
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white',
      zIndex: 99999
    }}>
      {/* Logo principal - style WhatsApp */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center'
      }}>
        <Image 
          src="/logo.jpg" 
          alt="Eat Neo Logo" 
          width={80} 
          height={80}
          style={{
            borderRadius: '50%',
            marginBottom: '20px'
          }}
        />
        
        <h1 style={{
          color: '#2e7d32',
          fontSize: '24px',
          fontWeight: '400',
          margin: 0,
          textAlign: 'center'
        }}>
          EAT NEO
        </h1>
      </div>
      
      {/* Spinner + Footer en bas */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: '60px',
        gap: '40px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(46, 125, 50, 0.3)',
          borderTop: '3px solid #2e7d32',
          borderRadius: '50%',
          animation: 'whatsappSpin 1s linear infinite'
        }}></div>
        
        <p style={{
          color: 'rgba(46, 125, 50, 0.7)',
          fontSize: '14px',
          margin: 0,
          fontWeight: '400'
        }}>
          de EAT NEO FAST FOOD
        </p>
      </div>
      
      <style>{`
        @keyframes whatsappSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes logoScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner