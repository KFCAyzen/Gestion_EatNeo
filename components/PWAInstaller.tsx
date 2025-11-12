'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    // Détecter si l'app est déjà installée (PWA)
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      const isInstalled = isStandalone || isInWebAppiOS
      setIsPWA(isInstalled)
      console.log('PWA Detection:', { isStandalone, isInWebAppiOS, isInstalled })
    }
    
    checkPWA()
    
    const handler = (e: Event) => {
      e.preventDefault()
      console.log('beforeinstallprompt event fired')
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Enregistrer le service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker enregistré'))
        .catch(() => console.log('Erreur Service Worker'))
    }

    // Fallback: afficher le bouton après 3 secondes si pas d'événement
    const fallbackTimer = setTimeout(() => {
      if (!showInstallButton && !isPWA) {
        console.log('Fallback: showing install button')
        setShowInstallButton(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(fallbackTimer)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available')
      // Fallback: ouvrir les instructions d'installation
      alert('Pour installer l\'application:\n\n1. Cliquez sur le menu du navigateur (⋮)\n2. Sélectionnez "Installer l\'application"\n3. Confirmez l\'installation')
      return
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log('Install prompt result:', outcome)
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowInstallButton(false)
      }
    } catch (error) {
      console.error('Install error:', error)
    }
  }

  // Ne pas afficher le bouton si l'app est déjà installée (PWA)
  if (isPWA) {
    console.log('PWA detected, hiding install button')
    return null
  }
  
  if (!showInstallButton) {
    console.log('Install button not shown yet')
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      zIndex: 1000,
      background: '#2e7d32',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '25px',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontSize: '14px',
      fontWeight: '600'
    }} onClick={handleInstall}>
Installer l'app
    </div>
  )
}