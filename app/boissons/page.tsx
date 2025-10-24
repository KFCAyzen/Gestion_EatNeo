'use client'

import { Suspense } from 'react'
import AppContent from '@/components/App'

function AppWrapper() {
  return <AppContent />
}

export default function BoissonsPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <AppWrapper />
    </Suspense>
  )
}