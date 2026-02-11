'use client'

export const dynamic = "force-dynamic"

import { Suspense } from 'react'
import AppShell from '@/components/AppShell'
import PanierRouteClient from '@/components/routes/PanierRouteClient'

export default function PanierRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <AppShell
        title="Panier"
        showBackButton={true}
        showSearch={false}
        showBottomBar={true}
        variant="public"
      >
        <PanierRouteClient />
      </AppShell>
    </Suspense>
  )
}
