'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C9.61386 21 7.50201 19.8924 6.12132 18.1213" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 16V12H7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface UniversalHeaderProps {
  title: string
  showBackButton?: boolean
  onBack?: () => void
  user?: any
  onAdminClick?: () => void
  onLogout?: () => void
}

export default function UniversalHeader({ title, showBackButton = true, onBack, user, onAdminClick, onLogout }: UniversalHeaderProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (Math.abs(currentScrollY - lastScrollY) > 5) {
        setIsHidden(true)
        setTimeout(() => setIsHidden(false), 150)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleMenuAction = (action: string) => {
    setShowMenu(false)
    switch (action) {
      case 'notifications':
        router.push('/notifications')
        break
      case 'admin':
        onAdminClick?.()
        break
      case 'logout':
        onLogout?.()
        break
      case 'refresh':
        handleRefresh()
        break
    }
  }

  return (
    <div className={`universal-header ${isHidden ? 'hidden' : ''}`}>
      <div className="universal-header-content">
        {showBackButton && (
          <button className="universal-back-btn" onClick={handleBack}>
            <BackIcon />
          </button>
        )}
        <h1 className="universal-header-title">{title}</h1>
        <div className="universal-header-actions">
          <div className="universal-menu-container">
            <button className="universal-menu-btn" onClick={() => setShowMenu(!showMenu)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="1" fill="white"/>
                <circle cx="12" cy="12" r="1" fill="white"/>
                <circle cx="12" cy="19" r="1" fill="white"/>
              </svg>
            </button>
            {showMenu && (
              <div className="universal-dropdown">
                <button onClick={() => handleMenuAction('refresh')}>
                  <RefreshIcon />
                  Actualiser
                </button>
                <button onClick={() => handleMenuAction('notifications')}>
                  Notifications
                </button>
                <button onClick={() => handleMenuAction('admin')}>
                  Administration
                </button>
                {user && (
                  <button onClick={() => handleMenuAction('logout')}>
                    Se déconnecter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}