'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15 18L9 12L15 6" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface MobileHeaderProps {
  title: string
  showBackButton?: boolean
  onBack?: () => void
  showNotifications?: boolean
  showAdmin?: boolean
  user?: any
  onAdminClick?: () => void
  onLogout?: () => void
}

const NotificationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const AdminIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17L21 12L16 7" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12H9" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function MobileHeader({ title, showBackButton = true, onBack, showNotifications, showAdmin, user, onAdminClick, onLogout }: MobileHeaderProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Masquer pendant le scroll
      if (Math.abs(currentScrollY - lastScrollY) > 5) {
        setIsHidden(true)
      }
      
      // Réapparaître après arrêt du scroll
      if (scrollTimeout) clearTimeout(scrollTimeout)
      const timeout = setTimeout(() => {
        setIsHidden(false)
      }, 150)
      setScrollTimeout(timeout)
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [lastScrollY, scrollTimeout])

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  const handleMenuAction = (action: string) => {
    setShowMenu(false)
    switch (action) {
      case 'refresh':
        window.location.reload()
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
    }
  }

  return (
    <div className={`mobile-header ${isHidden ? 'hidden' : ''}`}>
      <div className="mobile-header-content">
        {showBackButton && (
          <button className="mobile-back-btn" onClick={handleBack}>
            <BackIcon />
          </button>
        )}
        <h1 className="mobile-header-title">{title}</h1>
        <div className="mobile-header-actions">
          <div className="mobile-menu-container">
            <button className="mobile-menu-btn" onClick={() => setShowMenu(!showMenu)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="1" fill="#2e7d32"/>
                <circle cx="12" cy="12" r="1" fill="#2e7d32"/>
                <circle cx="12" cy="19" r="1" fill="#2e7d32"/>
              </svg>
            </button>
            {showMenu && (
              <div className="mobile-dropdown">
                <button onClick={() => handleMenuAction('refresh')}>Actualiser</button>
                <button onClick={() => handleMenuAction('notifications')}>Notifications</button>
                <button onClick={() => handleMenuAction('admin')}>Administration</button>
                {user && (
                  <button onClick={() => handleMenuAction('logout')}>Se déconnecter</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}