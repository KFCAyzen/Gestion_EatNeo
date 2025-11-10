'use client'

import { useRouter, usePathname } from 'next/navigation'

// Icônes SVG pour la bottom bar
const BoissonsIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5 12V7C5 5.89543 5.89543 5 7 5H17C18.1046 5 19 5.89543 19 7V12" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12C5 16.4183 8.58172 20 13 20H11C6.58172 20 3 16.4183 3 12V11H5V12Z" fill={active ? "rgba(46, 125, 50, 0.1)" : "none"} stroke={active ? "#2e7d32" : "#666"} strokeWidth="2.5"/>
    <path d="M19 12C19 16.4183 15.4183 20 11 20H13C17.4183 20 21 16.4183 21 12V11H19V12Z" fill={active ? "rgba(46, 125, 50, 0.1)" : "none"} stroke={active ? "#2e7d32" : "#666"} strokeWidth="2.5"/>
    <path d="M8 2L9 5M16 2L15 5" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const PlatsIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2.5" fill={active ? "rgba(46, 125, 50, 0.1)" : "none"}/>
    <path d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2.5"/>
    <path d="M8 12H16M12 8V16" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PanierIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V16.5" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill={active ? "rgba(46, 125, 50, 0.1)" : "none"}/>
    <circle cx="9" cy="20" r="1" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2.5" fill={active ? "#2e7d32" : "none"}/>
    <circle cx="20" cy="20" r="1" stroke={active ? "#2e7d32" : "#666"} strokeWidth="2.5" fill={active ? "#2e7d32" : "none"}/>
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
        padding: '0 20px'
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