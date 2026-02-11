'use client'

export const dynamic = "force-dynamic"

import { Suspense } from 'react'
import AppShell from '@/components/AppShell'
import PlatsRouteClient from '@/components/routes/PlatsRouteClient'

export default function HomePage() {
  return (
    <Suspense fallback={<div />}>
      <AppShell
        title="Plats"
        showBackButton={false}
        showSearch={true}
        showBottomBar={true}
        variant="public"
      >
        <PlatsRouteClient />
      </AppShell>
    </Suspense>
  )
}
