'use client'

export const dynamic = "force-dynamic"

import { Suspense } from 'react'
import AppShell from '@/components/AppShell'
import AdminRouteClient from '@/components/routes/AdminRouteClient'

export default function AdminRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <AppShell
        title="Back Office"
        showBackButton={true}
        showSearch={false}
        showBottomBar={false}
        variant="admin"
      >
        <AdminRouteClient />
      </AppShell>
    </Suspense>
  )
}
