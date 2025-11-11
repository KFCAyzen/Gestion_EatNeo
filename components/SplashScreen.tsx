'use client'

import { useEffect, useState } from 'react'
import '@/styles/SplashScreen.css'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)

  useEffect(() => {
    // Vérifier si c'est vraiment le premier lancement
    const hasShownSplash = localStorage.getItem('appStarted')
    const sessionStarted = sessionStorage.getItem('sessionStarted')
    const isInitialLoad = !window.performance || window.performance.navigation.type === 0
    
    // Ne montrer le splash que si :
    // 1. C'est le premier démarrage de l'app (localStorage)
    // 2. C'est un chargement initial (pas une navigation)
    // 3. Ce n'est pas déjà fait dans cette session
    if (!hasShownSplash && isInitialLoad && !sessionStarted) {
      // Précharger le logo
      const img = new Image()
      img.onload = () => setLogoLoaded(true)
      img.onerror = () => setLogoLoaded(true)
      img.src = '/logo.jpg'
      
      setIsVisible(true)
      localStorage.setItem('appStarted', 'true')
      sessionStorage.setItem('sessionStarted', 'true')
      
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