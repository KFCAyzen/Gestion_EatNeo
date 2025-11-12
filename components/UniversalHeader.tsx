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
    <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C9.61386 21 7.50201 19.8924 6.12132 18.1213" stroke="#4caf50" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 16V12H7" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13M9 21C9.6 21 10 20.6 10 20S9.6 19 9 19 8 19.4 8 20 8.4 21 9 21ZM20 21C20.6 21 21 20.6 21 20S20.6 19 20 19 19 19.4 19 20 19.4 21 20 21Z" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DrinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M5 12V7C5 5.89543 5.89543 5 7 5H17C18.1046 5 19 5.89543 19 7V12M5 12L3 20H21L19 12M5 12H19M12 1V5" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
      case 'drinks':
        router.push('/boissons')
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
                <button onClick={() => handleMenuAction('drinks')}>
                  <DrinkIcon />
                  Boissons
                </button>
                <button onClick={() => handleMenuAction('refresh')}>
                  <RefreshIcon />
                  Actualiser
                </button>
                <button onClick={() => handleMenuAction('notifications')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Notifications
                </button>
                <button onClick={() => handleMenuAction('admin')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15C16.4183 15 20 11.4183 20 7C20 2.58172 16.4183 -1 12 -1C7.58172 -1 4 2.58172 4 7C4 11.4183 7.58172 15 12 15Z" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Administration
                </button>
                {user && (
                  <button onClick={() => handleMenuAction('logout')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17L21 12L16 7" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H9" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
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