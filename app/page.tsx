'use client'

import { useState, useEffect } from 'react'
import AppContent from '@/components/App'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2300) // 2.3 secondes

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return <AppContent />
}