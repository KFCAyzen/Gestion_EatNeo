'use client'

export const dynamic = "force-dynamic"

import { Suspense } from 'react'
import AppShell from '@/components/AppShell'
import HistoriqueRouteClient from '@/components/routes/HistoriqueRouteClient'

export default function HistoriqueRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <AppShell
        title="Historique"
        showBackButton={true}
        showSearch={false}
        showBottomBar={true}
        variant="public"
      >
        <HistoriqueRouteClient />
      </AppShell>
    </Suspense>
  )
}
