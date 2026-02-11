'use client'

import '@/styles/App.css'
import '@/styles/Auth.css'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import AdminLogin from './AdminLogin'
import NotificationManager from './NotificationManager'
import OfflineIndicator from './OfflineIndicator'
import MobileHeader from './MobileHeader'
import UniversalHeader from './UniversalHeader'
import BottomBar from './BottomBar'
import DesktopMenu from './DesktopMenu'
import SyncStatus from './SyncStatus'
import OfflinePreloader from './OfflinePreloader'
import LegacySupport from './LegacySupport'

import { useAuth } from '../hooks/useAuth'
import { useNotificationCount } from '../hooks/useNotificationCount'
import { usePWADetection } from '../hooks/usePWADetection'
import { useMenuSync } from '../hooks/useMenuSync'
import { useFirebaseAnonAuth } from '../hooks/useFirebaseAnonAuth'
import { useAppShellStore } from '@/stores/appShellStore'

import type { MenuItem } from './types'
import { images } from './imagesFallback'

// Icône de déconnexion SVG
const LogoutIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12H9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Icône admin SVG
const AdminIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M12 15C16.4183 15 20 11.4183 20 7C20 2.58172 16.4183 -1 12 -1C7.58172 -1 4 2.58172 4 7C4 11.4183 7.58172 15 12 15Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Icône notifications SVG avec badge
const NotificationIcon = ({ count }: { count?: number }) => (
  <div className="notification-icon-wrapper">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {count && count > 0 && (
      <span className="notification-badge">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </div>
)

// Icône retour SVG
const BackIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export type AppShellContextValue = {
  user: ReturnType<typeof useAuth>['user']
  cartItems: MenuItem[]
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>
  onAddToCart: (item: MenuItem) => void
  searchTerm: string
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>
  table: string | null
  requestAdminLogin: () => void
}

export const useAppShell = () => {
  const { user } = useAuth()
  const cartItems = useAppShellStore((state) => state.cartItems)
  const setCartItems = useAppShellStore((state) => state.setCartItems)
  const onAddToCart = useAppShellStore((state) => state.onAddToCart)
  const searchTerm = useAppShellStore((state) => state.searchTerm)
  const setSearchTerm = useAppShellStore((state) => state.setSearchTerm)
  const table = useAppShellStore((state) => state.table)
  const requestAdminLogin = useAppShellStore((state) => state.requestAdminLogin)

  return {
    user,
    cartItems,
    setCartItems,
    onAddToCart,
    searchTerm,
    setSearchTerm,
    table,
    requestAdminLogin
  }
}

type AppShellProps = {
  title: string
  showBackButton?: boolean
  showSearch?: boolean
  showBottomBar?: boolean
  variant?: 'public' | 'admin'
  children: React.ReactNode
}

export default function AppShell({
  title,
  showBackButton = false,
  showSearch = false,
  showBottomBar = true,
  variant = 'public',
  children
}: AppShellProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, login, logout, isOnline } = useAuth()
  const { isDesktop } = usePWADetection()
  const { newItemsCount } = useMenuSync()
  const initializeShell = useAppShellStore((state) => state.initialize)
  const cartItems = useAppShellStore((state) => state.cartItems)
  const setCartItems = useAppShellStore((state) => state.setCartItems)
  const onAddToCart = useAppShellStore((state) => state.onAddToCart)
  const searchTerm = useAppShellStore((state) => state.searchTerm)
  const setSearchTerm = useAppShellStore((state) => state.setSearchTerm)
  const table = useAppShellStore((state) => state.table)
  const setTable = useAppShellStore((state) => state.setTable)
  const showLogin = useAppShellStore((state) => state.showLogin)
  const requestAdminLogin = useAppShellStore((state) => state.requestAdminLogin)
  const closeAdminLogin = useAppShellStore((state) => state.closeAdminLogin)
  const [showScrollUp, setShowScrollUp] = useState(false)

  useFirebaseAnonAuth()

  const canAccessBackofficeNotifications = user?.role === 'admin' || user?.role === 'superadmin'
  const notificationCount = useNotificationCount(!!canAccessBackofficeNotifications && isOnline)

  useEffect(() => {
    initializeShell()
  }, [initializeShell])

  useEffect(() => {
    const tableParam = searchParams.get('table')
    const chambreParam = searchParams.get('chambre')
    const hp03Param = searchParams.get('HP03')

    if (tableParam) {
      setTable(`Table ${tableParam}`)
      return
    }
    if (chambreParam) {
      setTable(`Chambre ${chambreParam}`)
      return
    }
    if (hp03Param !== null) {
      setTable('HP03')
      return
    }
    setTable(null)
  }, [searchParams, setTable])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollUp(window.scrollY > 200)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (variant === 'admin') {
      document.body.classList.add('admin-page')
    } else {
      document.body.classList.remove('admin-page')
    }
    return () => document.body.classList.remove('admin-page')
  }, [variant])

  const handleBack = () => {
    if (variant === 'admin') {
      router.push('/')
    } else {
      router.back()
    }
  }

  const contextValue: AppShellContextValue = {
    user,
    cartItems,
    setCartItems,
    onAddToCart,
    searchTerm,
    setSearchTerm,
    table,
    requestAdminLogin
  }

  return (
    <LegacySupport>
      <OfflinePreloader>
        {/* Keep local variable to preserve compatibility with existing route hooks */}
        {/* PWA DESKTOP/TABLET HEADER */}
        <UniversalHeader
          title={title}
          showBackButton={showBackButton}
          onBack={handleBack}
          user={user}
          onAdminClick={() => user ? router.push('/admin') : requestAdminLogin()}
          onLogout={() => {
            void logout()
            router.push('/')
          }}
        />

        {/* MOBILE HEADER */}
        {!isDesktop && (
          <MobileHeader
            title={title}
            showBackButton={showBackButton}
            onBack={handleBack}
            showNotifications={!!canAccessBackofficeNotifications}
            showAdmin={true}
            user={user}
            onAdminClick={() => user ? router.push('/admin') : requestAdminLogin()}
            onLogout={() => {
              void logout()
              router.push('/')
            }}
          />
        )}

        {/* DESKTOP HEADER */}
        <div className="title">
          {variant === 'admin' ? (
            // Header mobile pour back office
            <>
              <div className="title-left mobile-admin-header">
                <button
                  onClick={() => router.push('/')}
                  className="back-btn mobile-only"
                >
                  <BackIcon />
                </button>
                <span className="admin-title mobile-only">Back Office</span>
                {/* Desktop: logo et titre normaux */}
                <div className="desktop-only">
                  <Image src="/logo.jpg" alt="PH" width={50} height={50} />
                  <h1>EAT NEO FAST FOOD</h1>
                </div>
              </div>
              <div className="title-right">
                <DesktopMenu cartItemsCount={cartItems.length} />
                {canAccessBackofficeNotifications ? (
                  <Link href="/notifications" className="notification-link">
                    <NotificationIcon count={notificationCount} />
                  </Link>
                ) : null}
                <span className="user-name">{user?.username}</span>
                <button
                  className="logout-btn"
                  onClick={() => {
                    void logout()
                    router.push('/')
                  }}
                >
                  <LogoutIcon />
                </button>
              </div>
            </>
          ) : (
            // Header normal
            <>
              <div className="title-left">
                <Image src="/logo.jpg" alt="PH" width={50} height={50} />
                <h1>EAT NEO FAST FOOD</h1>
              </div>
              <div className="title-right">
                <DesktopMenu cartItemsCount={cartItems.length} />
                {canAccessBackofficeNotifications ? (
                  <Link href="/notifications" className="notification-link">
                    <NotificationIcon count={notificationCount} />
                  </Link>
                ) : null}
                <button
                  onClick={() => user ? router.push('/admin') : requestAdminLogin()}
                  className="admin-link"
                >
                  <AdminIcon />
                </button>
                {user ? (
                  <>
                    <span className="user-name">{user.username}</span>
                    <button
                      className="logout-btn"
                      onClick={() => {
                        void logout()
                        router.push('/')
                      }}
                    >
                      <LogoutIcon />
                    </button>
                  </>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* Barre de recherche */}
        {showSearch && (
          <div className="search-container">
            <div className="search-wrapper">
              <Image src={images.search} alt="search" className="search-icon" width={20} height={20} />
              <input
                type="search"
                placeholder="Rechercher un plat ou une boisson..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-modern"
              />
            </div>
          </div>
        )}

        {/* CONTENT */}
        {children}

        {/* LOGIN OVERLAY */}
        {showLogin && (
          <div className="login-overlay">
            <AdminLogin
              onLogin={async (username, password) => {
                const ok = await login(username, password)
                if (ok) {
                  closeAdminLogin()
                  router.push('/admin')
                  return true
                }
                return false
              }}
              onClose={closeAdminLogin}
            />
          </div>
        )}

        {/* BOTTOM BAR */}
        {showBottomBar && <BottomBar cartItemsCount={cartItems.length} />}

        {showScrollUp && (
          <div
            style={{
              position: 'fixed',
              bottom: '90px',
              right: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: '#2e7d32',
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 1000,
              opacity: 1,
              transition: 'opacity 0.3s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 15L12 9L6 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {canAccessBackofficeNotifications ? <NotificationManager /> : null}
        <OfflineIndicator />
        <SyncStatus />

        {/* Notification des nouveaux articles */}
        {newItemsCount > 0 && (
          <div style={{
            position: 'fixed',
            top: '70px',
            right: '20px',
            background: '#4caf50',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 1001,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            {newItemsCount} nouvelles images mises en cache
          </div>
        )}
      </OfflinePreloader>
    </LegacySupport>
  )
}
