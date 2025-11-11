'use client'

import { useState, useEffect } from 'react'

export function usePWADetection() {
  const [isPWA, setIsPWA] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkPWA = () => {
      // Vérifier si l'app est installée (PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://')
      
      // Vérifier si c'est desktop (pas mobile)
      const isDesktopSize = window.innerWidth >= 769
      
      setIsPWA(isStandalone)
      setIsDesktop(isDesktopSize)
    }

    checkPWA()
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const resizeHandler = () => checkPWA()
    
    mediaQuery.addListener(checkPWA)
    window.addEventListener('resize', resizeHandler)
    
    return () => {
      mediaQuery.removeListener(checkPWA)
      window.removeEventListener('resize', resizeHandler)
    }
  }, [])

  return { isPWA, isDesktop, isPWADesktop: isPWA && isDesktop }
}