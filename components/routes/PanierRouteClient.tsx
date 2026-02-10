'use client'

import { useAppShell } from '../AppShell'
import CartPage from '../CartPage'

export default function PanierRouteClient() {
  const { cartItems, setCartItems, table } = useAppShell()
  return (
    <CartPage
      cartItems={cartItems}
      setCartItems={setCartItems}
      localisation={table}
    />
  )
}
