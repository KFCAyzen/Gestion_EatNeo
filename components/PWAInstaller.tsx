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
      setIsPWA(isStandalone)
    }
    
    checkPWA()
    
    const handler = (e: Event) => {
      e.preventDefault()
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

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallButton(false)
    }
  }

  // Ne pas afficher le bouton si l'app est déjà installée (PWA)
  if (!showInstallButton || isPWA) return null

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
      📱 Installer l'app
    </div>
  )
}