'use client'

const LoadingSpinner = () => {
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
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      zIndex: 99999
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          position: 'relative',
          width: '60px',
          height: '60px'
        }}>
          <div style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
            animation: 'pulse1 1.5s ease-in-out infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #4caf50, #81c784)',
            animation: 'pulse2 1.5s ease-in-out infinite 0.3s'
          }}></div>
          <div style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #81c784, #a5d6a7)',
            animation: 'pulse3 1.5s ease-in-out infinite 0.6s'
          }}></div>
        </div>
        
        <div style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#2e7d32',
          animation: 'fadeInOut 2s ease-in-out infinite',
          letterSpacing: '2px'
        }}>
          EAT NEO
        </div>
      </div>
      
      <style>{`
        @keyframes pulse1 {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes pulse2 {
          0%, 100% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes pulse3 {
          0%, 100% { transform: scale(0.8); opacity: 0.2; }
          50% { transform: scale(1); opacity: 0.6; }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner