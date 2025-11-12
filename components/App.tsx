'use client'

import '@/styles/App.css'
import '@/styles/Auth.css'
import PlatsPage from './PlatsPage'
import BoissonsPage from './BoissonsPage'
import CartPage from './CartPage'
import ProtectedAdminRoute from './ProtectedAdminRoute'
import HistoriquePage from './HistoriquePage'
import AdminLogin from './AdminLogin'
import PWAInstaller from './PWAInstaller'
import NotificationManager from './NotificationManager'
import OfflineIndicator from './OfflineIndicator'
import { useAuth } from '../hooks/useAuth'
import { useNotificationCount } from '../hooks/useNotificationCount'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { MenuItem } from './types'
import { images } from './imagesFallback'

// Icône de déconnexion SVG
const LogoutIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12H9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icône admin SVG
const AdminIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M12 15C16.4183 15 20 11.4183 20 7C20 2.58172 16.4183 -1 12 -1C7.58172 -1 4 2.58172 4 7C4 11.4183 7.58172 15 12 15Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icône notifications SVG avec badge
const NotificationIcon = ({ count }: { count?: number }) => (
  <div style={{ position: 'relative' }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {count && count > 0 && (
      <span style={{
        position: 'absolute',
        top: '-2px',
        right: '-2px',
        backgroundColor: '#ef4444',
        color: 'white',
        borderRadius: '50%',
        width: '18px',
        height: '18px',
        fontSize: '10px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '18px'
      }}>
        {count > 99 ? '99+' : count}
      </span>
    )}
  </div>
);

// Icône retour SVG
const BackIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);



import MobileHeader from './MobileHeader'
import UniversalHeader from './UniversalHeader'
import BottomBar from './BottomBar'
import DesktopMenu from './DesktopMenu'
import SyncStatus from './SyncStatus'
import OfflinePreloader from './OfflinePreloader'
import { usePWADetection } from '../hooks/usePWADetection'
import { useMenuSync } from '../hooks/useMenuSync'

export default function AppContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, login, logout, isAdmin } = useAuth()
  const { isDesktop } = usePWADetection()
  const { newItemsCount, isOnline, syncMenu, cacheImage } = useMenuSync()
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [table, setTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const notificationCount = useNotificationCount();

  const getPageTitle = () => {
    switch (pathname) {
      case '/admin': return 'Back Office'
      case '/panier': return 'Panier'
      case '/historique': return 'Historique'
      case '/boissons': return 'Boissons'
      case '/': return 'Plats'
      default: return 'EAT NEO'
    }
  }

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) setCartItems(JSON.parse(storedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Optimisation: Mémoriser le calcul de la table
  const tableValue = useMemo(() => {
    const tableParam = searchParams.get('table');
    const chambreParam = searchParams.get('chambre');
    const hp03Param = searchParams.get('HP03');

    if (tableParam) return `Table ${tableParam}`;
    if (chambreParam) return `Chambre ${chambreParam}`;
    if (hp03Param !== null) return 'HP03';
    return null;
  }, [searchParams]);

  useEffect(() => {
    setTable(tableValue);
  }, [tableValue]);

  // Optimisation: Throttle du scroll pour améliorer les performances
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollUp(window.scrollY > 200);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Optimisation: Mémoriser la fonction de conversion de prix
  const prixToString = useCallback((
    prix: string | { label: string; value: string; selected?: boolean }[]
  ): string => {
    if (typeof prix === "string") return prix;
    if (Array.isArray(prix)) {
      const selected = prix.find((p) => p.selected);
      return selected ? selected.value : prix[0].value;
    }
    return "";
  }, []);

  // Optimisation: Mémoriser la fonction d'ajout au panier et utiliser un index
  const cartItemsIndex = useMemo(() => {
    const index = new Map<string, number>();
    cartItems.forEach((item, idx) => {
      const key = `${item.id}-${prixToString(item.prix)}`;
      index.set(key, idx);
    });
    return index;
  }, [cartItems, prixToString]);

  const handleAddToCart = useCallback((item: MenuItem) => {
    const prixStr = prixToString(item.prix);
    const uniqueKey = `${item.id}-${prixStr}`;
    const existingIndex = cartItemsIndex.get(uniqueKey);

    if (existingIndex !== undefined) {
      setCartItems(prev => {
        const newItems = [...prev];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantité: (newItems[existingIndex].quantité ?? 0) + 1
        };
        return newItems;
      });
    } else {
      setCartItems(prev => [...prev, { ...item, prix: prixStr, quantité: 1 }]);
    }
  }, [prixToString, cartItemsIndex]);

  // Ajouter classe admin-page au body si on est sur admin
  useEffect(() => {
    if (pathname === '/admin') {
      document.body.classList.add('admin-page')
    } else {
      document.body.classList.remove('admin-page')
    }
    return () => document.body.classList.remove('admin-page')
  }, [pathname])



  return (
    <OfflinePreloader>
      {/* PWA DESKTOP/TABLET HEADER */}
      <UniversalHeader 
        title={getPageTitle()}
        showBackButton={pathname !== '/' && pathname !== '/boissons'}
        onBack={() => {
          if (pathname === '/admin') {
            router.push('/')
          } else {
            router.back()
          }
        }}
        user={user}
        onAdminClick={() => user ? router.push('/admin') : setShowLogin(true)}
        onLogout={() => {
          logout()
          router.push('/')
        }}
      />
      
      {/* MOBILE HEADER */}
      {!isDesktop && (
        <MobileHeader 
          title={getPageTitle()}
          showBackButton={pathname !== '/' && pathname !== '/boissons'}
          onBack={() => {
            if (pathname === '/admin') {
              router.push('/')
            } else {
              router.back()
            }
          }}
          showNotifications={true}
          showAdmin={true}
          user={user}
          onAdminClick={() => user ? router.push('/admin') : setShowLogin(true)}
          onLogout={() => {
            logout()
            router.push('/')
          }}
        />
      )}
      
      {/* DESKTOP HEADER */}
      <div className="title">
        {pathname === '/admin' ? (
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
              <Link href="/notifications" className="notification-link">
                <NotificationIcon count={notificationCount} />
              </Link>
              <span className="user-name">{user?.username}</span>
              <button 
                className="logout-btn"
                onClick={() => {
                  logout()
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
              <Link href="/notifications" className="notification-link">
                <NotificationIcon count={notificationCount} />
              </Link>
              <button 
                onClick={() => user ? router.push('/admin') : setShowLogin(true)} 
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
                      logout()
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
      {pathname !== '/panier' && pathname !== '/admin' && pathname !== '/historique' && (
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
      {pathname === '/' && (
        <PlatsPage
          onAddToCart={handleAddToCart}
          searchTerm={searchTerm}
        />
      )}
      {pathname === '/boissons' && (
        <BoissonsPage
          onAddToCart={handleAddToCart}
          searchTerm={searchTerm}
        />
      )}
      {pathname === '/panier' && (
        <CartPage
          cartItems={cartItems}
          setCartItems={setCartItems}
          localisation={table}
        />
      )}
      {pathname === '/admin' && user && <ProtectedAdminRoute userRole={user.role} />}
      
      {showLogin && (
        <div className="login-overlay">
          <AdminLogin 
            onLogin={(username, password) => {
              if (login(username, password)) {
                setShowLogin(false)
                // Redirection vers admin après connexion réussie
                router.push('/admin')
                return true
              }
              return false
            }}
            onClose={() => setShowLogin(false)}
          />
        </div>
      )}
      {pathname === '/historique' && <HistoriquePage />}

      {/* BOTTOM BAR */}
      {pathname !== '/admin' && <BottomBar cartItemsCount={cartItems.length} />}

      {showScrollUp && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "15px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            backgroundColor: "#2e7d32",
            borderRadius: "50%",
            cursor: "pointer",
            zIndex: 1000,
            opacity: 1,
            transition: "opacity 0.3s ease",
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 15L12 9L6 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      
      <PWAInstaller />
      <NotificationManager />
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
  );
}


