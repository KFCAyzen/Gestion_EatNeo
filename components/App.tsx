'use client'

import '@/styles/App.css'
import PlatsPage from './PlatsPage'
import BoissonsPage from './BoissonsPage'
import CartPage from './CartPage'
import ProtectedAdminRoute from './ProtectedAdminRoute'
import HistoriquePage from './HistoriquePage'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { MenuItem } from './types'
import { images } from './imagesFallback'



export default function AppContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [table, setTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showScrollUp, setShowScrollUp] = useState(false);
;

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
          <h1>EAT NEO</h1>
        </div>
        <div className="title-right">
          {pathname === '/admin' ? (
            <button 
              className="logout-btn"
              onClick={async () => {
                try {
                  const { signOut } = await import('firebase/auth');
                  const { auth } = await import('./firebase');
                  await signOut(auth);
                  router.push('/')
                } catch (err) {
                  console.error(err)
                }
              }}
            >
              <Image src={images.logOut} alt="logOut" width={24} height={24} />
              <span>Déconnexion</span>
            </button>
          ) : (
            <Link href="/admin" className="admin-link">
              <Image src={images.adminActif} alt="admin" width={24} height={24} />
              <span>Admin</span>
            </Link>
          )}
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
      {pathname === '/admin' && <ProtectedAdminRoute />}
      {pathname === '/historique' && <HistoriquePage />}

      {/* BOTTOM BAR */}
      <nav
        className="bottom-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.71)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "2px 0",
          zIndex: 1000,
        }}
      >
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


