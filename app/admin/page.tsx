'use client'

export const dynamic = "force-dynamic"

import AppShell from '@/components/AppShell'
import AdminRouteClient from '@/components/routes/AdminRouteClient'

export default function AdminRoutePage() {
  return (
    <AppShell
      title="Back Office"
      showBackButton={true}
      showSearch={false}
      showBottomBar={false}
      variant="admin"
    >
      <AdminRouteClient />
    </AppShell>
  )
}
