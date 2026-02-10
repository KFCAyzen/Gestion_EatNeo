'use client'

import { useAppShell } from '../AppShell'
import PlatsPage from '../PlatsPage'

export default function PlatsRouteClient() {
  const { onAddToCart, searchTerm } = useAppShell()
  return (
    <PlatsPage
      onAddToCart={onAddToCart}
      searchTerm={searchTerm}
    />
  )
}
