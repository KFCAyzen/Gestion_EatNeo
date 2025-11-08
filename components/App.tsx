'use client'

import '@/styles/App.css'
import '@/styles/Auth.css'
import PlatsPage from './PlatsPage'
import BoissonsPage from './BoissonsPage'
import CartPage from './CartPage'
import ProtectedAdminRoute from './ProtectedAdminRoute'
import HistoriquePage from './HistoriquePage'
import AdminLogin from './AdminLogin'
import { useAuth } from '../hooks/useAuth'

import { useState, useEffect } from 'react'
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

// Icône notifications SVG
const NotificationIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);



export default function AppContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, login, logout, isAdmin } = useAuth()
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [table, setTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) setCartItems(JSON.parse(storedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const tableParam = searchParams.get('table')
    const chambreParam = searchParams.get('chambre')
    const hp03Param = searchParams.get('HP03')

    if (tableParam) setTable(`Table ${tableParam}`)
    else if (chambreParam) setTable(`Chambre ${chambreParam}`)
    else if (hp03Param !== null) setTable('HP03')
    else setTable(null)
  }, [searchParams])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollUp(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const prixToString = (
    prix: string | { label: string; value: string; selected?: boolean }[]
  ): string => {
    if (typeof prix === "string") return prix;
    if (Array.isArray(prix)) {
      const selected = prix.find((p) => p.selected);
      return selected ? selected.value : prix[0].value;
    }
    return "";
  };

  const handleAddToCart = (item: MenuItem) => {
    const prixStr = prixToString(item.prix);
    const uniqueKey = `${item.id}-${prixStr}`;

    const existingItem = cartItems.find(
      (i) => `${i.id}-${prixToString(i.prix)}` === uniqueKey
    );

    if (existingItem) {
      setCartItems(
        cartItems.map((i) =>
          `${i.id}-${prixToString(i.prix)}` === uniqueKey
            ? { ...i, quantité: (i.quantité ?? 0) + 1 }
            : i
        )
      );
    } else {
      setCartItems([...cartItems, { ...item, prix: prixStr, quantité: 1 }]);
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="title">
        <div className="title-left">
          <Image src="/logo.jpg" alt="PH" width={50} height={50} />
          <h1>EAT NEO FAST FOOD</h1>
        </div>
        <div className="title-right">
          {(pathname === '/' || pathname === '/boissons') && (
            <button 
              onClick={() => user ? router.push('/admin') : setShowLogin(true)} 
              className="admin-link"
            >
              <AdminIcon />
            </button>
          )}
          {user ? (
            <>
              {pathname === '/admin' && (
                <Link href="/notifications" className="notification-link">
                  <NotificationIcon />
                </Link>
              )}
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
      <nav className="bottom-bar">
        <div className="menu">
          <Link href="/" style={{ textDecoration: 'none', color: 'black' }}>
            <Image
              src={pathname === '/' ? images.food2 : images.food}
              alt=""
              width={30}
              height={30}
            />
          </Link>
        </div>
        <div className="menu">
          <Link href="/boissons" style={{ textDecoration: 'none', color: 'black' }}>
            <Image
              className="bois"
              src={pathname === '/boissons' ? images.glass1 : images.glass}
              alt=""
              width={30}
              height={30}
            />
          </Link>
        </div>
        <div className="menu">
          <Link className="cartBtn" href="/panier">
            <Image
              src={pathname === '/panier' ? images.carts1 : images.carts}
              alt="Panier"
              width={30}
              height={30}
            />
            <p>{cartItems.length}</p>
          </Link>
        </div>

      </nav>

      {pathname !== '/panier' && pathname !== '/admin' && showScrollUp && (
        <div
          style={{
            position: "fixed",
            bottom: "70px",
            right: "15px",
            display: "flex",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            zIndex: 1000,
            opacity: 1,
            transition: "opacity 0.3s ease",
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Image
            src={images.up}
            style={{
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              borderRadius: '15px',
            }}
            alt=""
            width={35}
            height={35}
          />
        </div>
      )}
    </>
  );
}


