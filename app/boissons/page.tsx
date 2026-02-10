export const dynamic = "force-dynamic"

import AppShell from '@/components/AppShell'
import BoissonsRouteClient from '@/components/routes/BoissonsRouteClient'

export default function BoissonsRoutePage() {
  return (
    <AppShell
      title="Boissons"
      showBackButton={false}
      showSearch={true}
      showBottomBar={true}
      variant="public"
    >
      <BoissonsRouteClient />
    </AppShell>
  )
}
