export const dynamic = "force-dynamic"

import AppShell from '@/components/AppShell'
import PlatsRouteClient from '@/components/routes/PlatsRouteClient'

export default function HomePage() {
  return (
    <AppShell
      title="Plats"
      showBackButton={false}
      showSearch={true}
      showBottomBar={true}
      variant="public"
    >
      <PlatsRouteClient />
    </AppShell>
  )
}
