'use client'

export const dynamic = "force-dynamic"

import { Suspense } from 'react'
import AppShell from '@/components/AppShell'
import BoissonsRouteClient from '@/components/routes/BoissonsRouteClient'

export default function BoissonsRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <AppShell
        title="Boissons"
        showBackButton={false}
        showSearch={true}
        showBottomBar={true}
        variant="public"
      >
        <BoissonsRouteClient />
      </AppShell>
    </Suspense>
  )
}
