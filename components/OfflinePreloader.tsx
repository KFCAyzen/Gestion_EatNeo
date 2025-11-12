'use client'

import { useState, useEffect } from 'react'
import OfflineLoader from './OfflineLoader'
import OfflineSetupModal from './OfflineSetupModal'

interface OfflinePreloaderProps {
  children: React.ReactNode
}

export default function OfflinePreloader({ children }: OfflinePreloaderProps) {
  const [isReady, setIsReady] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isFirstLaunch, setIsFirstLaunch] = useState(false)
  const [installProgress, setInstallProgress] = useState({ completed: 0, total: 0 })

  useEffect(() => {
    const checkFirstLaunch = () => {
      const hasLaunchedBefore = localStorage.getItem('eatneo-offline-setup-complete')
      
      if (!hasLaunchedBefore) {
        setIsFirstLaunch(true)
        setShowLoader(true)
      } else {
        setIsReady(true)
      }
    }

    // Écouter les messages du service worker
    const handleSWMessage = (event: MessageEvent) => {
      const { type, completed, total } = event.data
      
      if (type === 'INSTALL_START') {
        setInstallProgress({ completed: 0, total })
      } else if (type === 'INSTALL_PROGRESS') {
        setInstallProgress({ completed, total })
      } else if (type === 'INSTALL_COMPLETE') {
        setTimeout(() => {
          if (isFirstLaunch) {
            handleLoaderComplete()
          }
        }, 1000)
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleSWMessage)
    checkFirstLaunch()

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
    }
  }, [isFirstLaunch])

  const handleLoaderComplete = () => {
    setShowLoader(false)
    setShowModal(true)
  }

  const handleModalClose = () => {
    localStorage.setItem('eatneo-offline-setup-complete', 'true')
    setShowModal(false)
    setIsReady(true)
  }

  if (showLoader) {
    return <OfflineLoader onComplete={handleLoaderComplete} progress={installProgress} />
  }

  if (showModal) {
    return (
      <>
        {children}
        <OfflineSetupModal onClose={handleModalClose} />
      </>
    )
  }

  if (!isReady) {
    return null
  }

  return <>{children}</>
}