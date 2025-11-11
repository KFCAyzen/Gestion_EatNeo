'use client'

import { useEffect, useState } from 'react'
import '@/styles/SplashScreen.css'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)

  useEffect(() => {
    // Précharger le logo pour le cache
    const preloadLogo = () => {
      const img = new Image()
      img.onload = () => setLogoLoaded(true)
      img.onerror = () => setLogoLoaded(true) // Continuer même en cas d'erreur
      img.src = '/logo.jpg'
    }

    // Vérifier si c'est le premier démarrage de l'app
    const hasShownSplash = localStorage.getItem('appStarted')
    
    if (!hasShownSplash) {
      preloadLogo()
      setIsVisible(true)
      localStorage.setItem('appStarted', 'true')
      
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <img 
          src="/logo.jpg" 
          alt="Eat Neo" 
          className="splash-logo"
        />
        <h1 className="splash-title">Eat Neo</h1>
        <div className="splash-loader">
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
        </div>
      </div>
    </div>
  )
}