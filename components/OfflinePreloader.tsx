'use client'

import { useEffect, useState } from 'react'

export default function OfflinePreloader() {
  const [isReady, setIsReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Initialisation...')

  useEffect(() => {
    let mounted = true

    const initializeOfflineApp = async () => {
      try {
        // Étape 1: Vérifier le service worker
        setStatus('Vérification du service worker...')
        setProgress(10)

        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js')
          
          // Écouter les messages du service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'SW_READY') {
              if (mounted) {
                setStatus('Application prête !')
                setProgress(100)
                setTimeout(() => setIsReady(true), 500)
              }
            }
          })

          setProgress(30)
          setStatus('Service worker enregistré...')

          // Attendre que le service worker soit actif
          if (registration.installing) {
            setStatus('Installation des ressources...')
            setProgress(50)
            await new Promise(resolve => {
              registration.installing!.addEventListener('statechange', () => {
                if (registration.installing!.state === 'installed') {
                  resolve(void 0)
                }
              })
            })
          }

          if (registration.waiting) {
            setStatus('Mise à jour en attente...')
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          }

          if (registration.active) {
            setStatus('Vérification du cache...')
            setProgress(70)
            
            // Vérifier que les ressources critiques sont en cache
            const cache = await caches.open('eatneo-static-v3.0')
            const cachedRequests = await cache.keys()
            
            if (cachedRequests.length > 0) {
              setStatus('Cache vérifié - Application prête !')
              setProgress(100)
              setTimeout(() => setIsReady(true), 1000)
            } else {
              setStatus('Mise en cache en cours...')
              setProgress(80)
              // Attendre un peu plus pour que le cache se remplisse
              setTimeout(() => {
                setStatus('Application prête !')
                setProgress(100)
                setTimeout(() => setIsReady(true), 500)
              }, 2000)
            }
          }
        } else {
          // Pas de service worker, continuer quand même
          setStatus('Mode compatibilité - Prêt !')
          setProgress(100)
          setTimeout(() => setIsReady(true), 1000)
        }
      } catch (error) {
        console.error('Erreur initialisation:', error)
        setStatus('Erreur - Mode dégradé')
        setProgress(100)
        setTimeout(() => setIsReady(true), 1000)
      }
    }

    // Démarrer l'initialisation après un court délai
    const timer = setTimeout(initializeOfflineApp, 500)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [])

  if (isReady) {
    return null // Le preloader disparaît quand l'app est prête
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Logo */}
      <div style={{
        width: '100px',
        height: '100px',
        background: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '30px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <img 
          src="/logo.jpg" 
          alt="EAT NEO" 
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%'
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>

      {/* Titre */}
      <h1 style={{
        fontSize: '2rem',
        marginBottom: '10px',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}>
        EAT NEO
      </h1>

      <p style={{
        fontSize: '1rem',
        marginBottom: '40px',
        opacity: 0.9,
        textAlign: 'center'
      }}>
        Préparation de l'application hors ligne
      </p>

      {/* Barre de progression */}
      <div style={{
        width: '280px',
        height: '6px',
        background: 'rgba(255,255,255,0.3)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'white',
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Statut */}
      <p style={{
        fontSize: '0.9rem',
        opacity: 0.8,
        textAlign: 'center',
        minHeight: '20px'
      }}>
        {status}
      </p>

      {/* Pourcentage */}
      <p style={{
        fontSize: '0.8rem',
        opacity: 0.6,
        marginTop: '10px'
      }}>
        {progress}%
      </p>
    </div>
  )
}