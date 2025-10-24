'use client'

import { useRouter, usePathname } from 'next/navigation'

// Icônes SVG pour la bottom bar
const HomeIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22V12H15V22" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CartIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="8" cy="21" r="1" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="21" r="1" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.05 2.05H4L6.2 12.6C6.37245 13.3923 6.76768 14.1154 7.33677 14.6846C7.90586 15.2538 8.62797 15.6423 9.42 15.8L18 16C18.7923 15.9977 19.5154 15.6023 20.0846 15.0332C20.6538 14.4641 21.0423 13.742 21.25 12.95L22 8H5.12" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AdminIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 15C16.4183 15 20 11.4183 20 7C20 2.58172 16.4183 -1 12 -1C7.58172 -1 4 2.58172 4 7C4 11.4183 7.58172 15 12 15Z" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function BottomBar() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { 
      icon: HomeIcon, 
      label: 'Accueil', 
      path: '/',
      active: pathname === '/'
    },
    { 
      icon: CartIcon, 
      label: 'Commande', 
      path: '/commande',
      active: pathname === '/commande'
    },
    { 
      icon: UserIcon, 
      label: 'Profil', 
      path: '/profil',
      active: pathname === '/profil'
    },
    { 
      icon: AdminIcon, 
      label: 'Admin', 
      path: '/admin',
      active: pathname === '/admin'
    }
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      padding: '8px 0',
      zIndex: 1000,
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
    }}>
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
                backgroundColor: item.active ? 'rgba(255, 107, 53, 0.1)' : 'transparent'
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
                color: item.active ? '#FF6B35' : '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}