'use client'

import { useAppShell } from '../AppShell'
import ProtectedAdminRoute from '../ProtectedAdminRoute'

export default function AdminRouteClient() {
  const { user, requestAdminLogin } = useAppShell()

  if (user) {
    return <ProtectedAdminRoute userRole={user.role} />
  }

  return (
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
  )
}
