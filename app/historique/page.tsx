export const dynamic = "force-dynamic"

import AppShell from '@/components/AppShell'
import HistoriqueRouteClient from '@/components/routes/HistoriqueRouteClient'

export default function HistoriqueRoutePage() {
  return (
    <AppShell
      title="Historique"
      showBackButton={true}
      showSearch={false}
      showBottomBar={true}
      variant="public"
    >
      <HistoriqueRouteClient />
    </AppShell>
  )
}
