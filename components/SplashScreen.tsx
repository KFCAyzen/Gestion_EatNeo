'use client'

import { useEffect, useState } from 'react'
import '@/styles/SplashScreen.css'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)

  useEffect(() => {
    // Vérifier si c'est un navigateur legacy
    const isLegacyBrowser = /Android [1-4]\./.test(navigator.userAgent) || 
                           typeof Promise === 'undefined' ||
                           typeof fetch === 'undefined'
    
    // Ne montrer le splash QUE si c'est le tout premier lancement
    const hasEverStarted = localStorage?.getItem('eatneo-ever-started')
    
    if (!hasEverStarted) {
      // Précharger le logo avec fallback pour anciens navigateurs
      if (typeof Image !== 'undefined') {
        const img = new Image()
        img.onload = () => setLogoLoaded(true)
        img.onerror = () => setLogoLoaded(true)
        img.src = '/logo.jpg'
      } else {
        setLogoLoaded(true)
      }
      
      setIsVisible(true)
      
      if (localStorage) {
        localStorage.setItem('eatneo-ever-started', 'true')
      }
      
      // Durée plus longue pour les navigateurs legacy
      const duration = isLegacyBrowser ? 4000 : 2000
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, duration)

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
          {/Android [1-4]\./.test(navigator.userAgent) && (
            <p style={{fontSize: '12px', opacity: 0.7, marginTop: '10px'}}>
              Mode compatibilité activé
            </p>
          )}
        </div>
      </div>
    </div>
  )
}