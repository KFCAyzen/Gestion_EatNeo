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

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13M9 21C9.6 21 10 20.6 10 20S9.6 19 9 19 8 19.4 8 20 8.4 21 9 21ZM20 21C20.6 21 21 20.6 21 20S20.6 19 20 19 19 19.4 19 20 19.4 21 20 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
      case 'cart':
        router.push('/panier')
        break
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
        <div className="universal-header-left">
          {showBackButton ? (
            <button className="universal-back-btn" onClick={handleBack}>
              <BackIcon />
            </button>
          ) : (
            <div style={{ width: '44px' }}></div>
          )}
        </div>
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
                <button onClick={() => handleMenuAction('cart')}>
                  <CartIcon />
                  Panier
                </button>
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