'use client'

import { create } from 'zustand'
import type { SetStateAction } from 'react'
import type { MenuItem } from '@/components/types'

type AppShellStoreState = {
  cartItems: MenuItem[]
  searchTerm: string
  table: string | null
  showLogin: boolean
  initialized: boolean
  initialize: () => void
  setCartItems: (action: SetStateAction<MenuItem[]>) => void
  onAddToCart: (item: MenuItem) => void
  setSearchTerm: (action: SetStateAction<string>) => void
  setTable: (table: string | null) => void
  requestAdminLogin: () => void
  closeAdminLogin: () => void
}

const CART_STORAGE_KEY = 'cart'

const prixToString = (prix: string | { label: string; value: string; selected?: boolean }[]): string => {
  if (typeof prix === 'string') return prix
  if (Array.isArray(prix)) {
    const selected = prix.find((p) => p.selected)
    return selected ? selected.value : prix[0]?.value || ''
  }
  return ''
}

const resolveAction = <T,>(action: SetStateAction<T>, prev: T): T => {
  return typeof action === 'function' ? (action as (value: T) => T)(prev) : action
}

export const useAppShellStore = create<AppShellStoreState>((set, get) => ({
  cartItems: [],
  searchTerm: '',
  table: null,
  showLogin: false,
  initialized: false,

  initialize: () => {
    if (get().initialized || typeof window === 'undefined') return

    let cartItems: MenuItem[] = []
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY)
      cartItems = storedCart ? (JSON.parse(storedCart) as MenuItem[]) : []
    } catch {
      cartItems = []
    }

    set({ initialized: true, cartItems })
  },

  setCartItems: (action) => {
    const next = resolveAction(action, get().cartItems)
    set({ cartItems: next })
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next))
    }
  },

  onAddToCart: (item) => {
    const current = get().cartItems
    const prixStr = prixToString(item.prix)
    const key = `${item.id}-${prixStr}`

    const existingIndex = current.findIndex((currentItem) => {
      return `${currentItem.id}-${prixToString(currentItem.prix)}` === key
    })

    const next = [...current]
    if (existingIndex >= 0) {
      next[existingIndex] = {
        ...next[existingIndex],
        quantité: (next[existingIndex].quantité ?? 0) + 1
      }
    } else {
      next.push({ ...item, prix: prixStr, quantité: 1 })
    }

    set({ cartItems: next })
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next))
    }
  },

  setSearchTerm: (action) => {
    const next = resolveAction(action, get().searchTerm)
    set({ searchTerm: next })
  },

  setTable: (table) => set({ table }),
  requestAdminLogin: () => set({ showLogin: true }),
  closeAdminLogin: () => set({ showLogin: false })
}))

