'use client'

import { useAppShell } from '../AppShell'
import HistoriquePage from '../HistoriquePage'

export default function HistoriqueRouteClient() {
  const { user } = useAppShell()

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Accès réservé au personnel. Veuillez vous connecter.
      </div>
    )
  }

  return <HistoriquePage />
}
