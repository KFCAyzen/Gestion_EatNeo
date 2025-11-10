'use client'

import { Suspense } from 'react'
import AppContent from '@/components/App'
import LoadingSpinner from '@/components/LoadingSpinner'

function AppWrapper() {
  return <AppContent />
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Chargement de l'application..." size={50} />}>
      <AppWrapper />
    </Suspense>
  )
}