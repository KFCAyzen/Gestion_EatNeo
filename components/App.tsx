'use client'

import { usePathname } from 'next/navigation'
import AppShell, { useAppShell } from './AppShell'
import PlatsPage from './PlatsPage'
import BoissonsPage from './BoissonsPage'
import CartPage from './CartPage'
import ProtectedAdminRoute from './ProtectedAdminRoute'
import HistoriquePage from './HistoriquePage'

function AppContentRoutes({ pathname }: { pathname: string }) {
  const {
    user,
    onAddToCart,
    searchTerm,
    cartItems,
    setCartItems,
    table,
    requestAdminLogin
  } = useAppShell()

  return (
    <>
      {pathname === '/' && (
        <PlatsPage
          onAddToCart={onAddToCart}
          searchTerm={searchTerm}
        />
      )}
      {pathname === '/boissons' && (
        <BoissonsPage
          onAddToCart={onAddToCart}
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
      {pathname === '/admin' && !user && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Accès réservé au personnel. Veuillez vous connecter.
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={requestAdminLogin}
              style={{
                backgroundColor: '#7d3837',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Se connecter
            </button>
          </div>
        </div>
      )}
      {pathname === '/historique' && (
        user ? (
          <HistoriquePage />
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            Accès réservé au personnel. Veuillez vous connecter.
          </div>
        )
      )}
    </>
  )
}

export default function AppContent() {
  const pathname = usePathname()

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

  const showSearch = pathname !== '/panier' && pathname !== '/admin' && pathname !== '/historique'
  const showBottomBar = pathname !== '/admin'
  const showBackButton = pathname !== '/' && pathname !== '/boissons'
  const variant = pathname === '/admin' ? 'admin' : 'public'

  return (
    <AppShell
      title={getPageTitle()}
      showBackButton={showBackButton}
      showSearch={showSearch}
      showBottomBar={showBottomBar}
      variant={variant}
    >
      <AppContentRoutes pathname={pathname} />
    </AppShell>
  )
}
