'use client'

import { useEffect, useState } from 'react'
import '@/styles/SplashScreen.css'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Vérifier si c'est le premier chargement de l'app
    const hasShownSplash = sessionStorage.getItem('splashShown')
    
    if (!hasShownSplash) {
      setIsVisible(true)
      sessionStorage.setItem('splashShown', 'true')
      
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