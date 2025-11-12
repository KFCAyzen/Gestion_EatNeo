'use client'

import { useEffect, useState } from 'react'
import '@/styles/SplashScreen.css'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)

  useEffect(() => {
    // Ne montrer le splash QUE si c'est le tout premier lancement
    const hasEverStarted = localStorage.getItem('eatneo-ever-started')
    
    if (!hasEverStarted) {
      // Précharger le logo
      const img = new Image()
      img.onload = () => setLogoLoaded(true)
      img.onerror = () => setLogoLoaded(true)
      img.src = '/logo.jpg'
      
      setIsVisible(true)
      localStorage.setItem('eatneo-ever-started', 'true')
      
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="splash-screen-whatsapp">
      <div className="splash-content-whatsapp">
        <div className="splash-main">
          <img 
            src="/logo.jpg" 
            alt="Eat Neo" 
            className="splash-logo-whatsapp"
          />
          <h1 className="splash-title-whatsapp">EAT NEO</h1>
          <p className="splash-subtitle">Fast Food</p>
        </div>
        
        <div className="splash-footer">
          <div className="splash-spinner"></div>
          <p className="splash-footer-text">de EAT NEO FAST FOOD</p>
        </div>
      </div>
    </div>
  )
}