'use client'

import { useRouter, usePathname } from 'next/navigation'

// Icônes SVG pour la bottom bar
const BoissonsIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M6 2L8 6H16L18 2" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 6V18C8 19.1046 8.89543 20 10 20H14C15.1046 20 16 19.1046 16 18V6" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={active ? "rgba(46, 125, 50, 0.08)" : "none"}/>
    <path d="M10 10C10 11.1046 10.8954 12 12 12C13.1046 12 14 11.1046 14 10" stroke={active ? "#2e7d32" : "#666"} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="22" r="1" fill={active ? "#2e7d32" : "#999"}/>
  </svg>
);

const PlatsIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2" fill={active ? "rgba(46, 125, 50, 0.08)" : "none"}/>
    <path d="M8 8L16 16M16 8L8 16" stroke={active ? "#2e7d32" : "#999"} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="2" fill={active ? "#2e7d32" : "#999"}/>
    <path d="M12 4V2M12 22V20M20 12H22M2 12H4" stroke={active ? "#2e7d32" : "#999"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const PanierIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 7H5L5.4 9M7 16H17L21 7H5.4M7 16L5.4 9M7 16L4.7 18.3C4.3 18.7 4.6 19.5 5.1 19.5H17" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 11V13" stroke={active ? "#2e7d32" : "#999"} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9" cy="21" r="1" fill={active ? "#2e7d32" : "#666"}/>
    <circle cx="17" cy="21" r="1" fill={active ? "#2e7d32" : "#666"}/>
  </svg>
);

interface BottomBarProps {
  cartItemsCount?: number
}

export default function BottomBar({ cartItemsCount = 0 }: BottomBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { 
      icon: BoissonsIcon, 
      label: 'Boissons', 
      path: '/boissons',
      active: pathname === '/boissons'
    },
    { 
      icon: PlatsIcon, 
      label: 'Plats', 
      path: '/',
      active: pathname === '/'
    },
    { 
      icon: PanierIcon, 
      label: 'Panier', 
      path: '/panier',
      active: pathname === '/panier'
    }
  ]

  return (
    <div className="bottom-bar">
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        maxWidth: '500px',
        margin: '0 auto',
        padding: '0 40px',
        gap: '20px'
      }}>
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                backgroundColor: item.active ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!item.active) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!item.active) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <IconComponent active={item.active} />
              <span style={{
                fontSize: '11px',
                fontWeight: item.active ? '600' : '500',
                color: item.active ? '#2e7d32' : '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {item.label}
              </span>
              {item.path === '/panier' && cartItemsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '8px',
                  backgroundColor: '#25d366',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '10px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white'
                }}>
                  {cartItemsCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}