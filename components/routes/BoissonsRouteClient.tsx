'use client'

import { useAppShell } from '../AppShell'
import BoissonsPage from '../BoissonsPage'

export default function BoissonsRouteClient() {
  const { onAddToCart, searchTerm } = useAppShell()
  return (
    <BoissonsPage
      onAddToCart={onAddToCart}
      searchTerm={searchTerm}
    />
  )
}
