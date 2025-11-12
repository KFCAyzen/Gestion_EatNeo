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

    checkFirstLaunch()
  }, [])

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
    return <OfflineLoader onComplete={handleLoaderComplete} />
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