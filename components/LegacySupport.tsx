'use client'

import { useEffect, useState } from 'react'

// Polyfills pour les anciens navigateurs
const addPolyfills = () => {
  // Polyfill pour Array.find
  if (!Array.prototype.find) {
    Array.prototype.find = function(predicate: any) {
      for (let i = 0; i < this.length; i++) {
        if (predicate(this[i], i, this)) {
          return this[i]
        }
      }
      return undefined
    }
  }

  // Polyfill pour Object.assign
  if (!Object.assign) {
    Object.assign = function(target: any, ...sources: any[]) {
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i]
        for (const key in source) {
          if (source.hasOwnProperty(key)) {
            target[key] = source[key]
          }
        }
      }
      return target
    }
  }

  // Polyfill pour requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback: FrameRequestCallback) {
      return window.setTimeout(callback, 16)
    }
  }

  // Note: Promise polyfill géré par le script legacy-check.js
}

// Détection de compatibilité
const checkCompatibility = () => {
  const userAgent = navigator.userAgent
  const isOldAndroid = /Android [1-4]\./.test(userAgent)
  const isOldChrome = /Chrome\/[1-3][0-9]\./.test(userAgent)
  const isOldWebKit = /WebKit\/[1-5][0-9][0-9]\./.test(userAgent)
  
  return {
    isLegacyBrowser: isOldAndroid || isOldChrome || isOldWebKit,
    userAgent,
    supportsES6: typeof Symbol !== 'undefined',
    supportsFetch: typeof fetch !== 'undefined',
    supportsLocalStorage: typeof localStorage !== 'undefined'
  }
}

export default function LegacySupport({ children }: { children: React.ReactNode }) {
  const [isCompatible, setIsCompatible] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Ajouter les polyfills
    addPolyfills()
    
    // Vérifier la compatibilité
    const compatibility = checkCompatibility()
    
    if (compatibility.isLegacyBrowser) {
      console.log('Navigateur legacy détecté:', compatibility.userAgent)
      
      // Mode de compatibilité pour les anciens navigateurs
      document.body.classList.add('legacy-browser')
      
      // Désactiver certaines animations CSS
      const style = document.createElement('style')
      style.textContent = `
        .legacy-browser * {
          transition: none !important;
          animation: none !important;
          transform: none !important;
        }
        .legacy-browser .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #2e7d32;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `
      document.head.appendChild(style)
    }
    
    setIsCompatible(true)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div className="spinner" style={{
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #2e7d32',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px', color: '#666' }}>
          Chargement...
        </p>
      </div>
    )
  }

  if (!isCompatible) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2 style={{ color: '#856404' }}>Navigateur non compatible</h2>
        <p style={{ color: '#856404' }}>
          Votre navigateur est trop ancien pour utiliser cette application.
          Veuillez mettre à jour votre navigateur ou utiliser un navigateur plus récent.
        </p>
      </div>
    )
  }

  return <>{children}</>
}