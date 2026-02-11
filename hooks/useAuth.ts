'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuthStore, type AuthStoreState, type User, type UserRole } from '@/stores/authStore'

export type { User, UserRole }

export const useAuth = () => {
  const user = useAuthStore((state: AuthStoreState) => state.user)
  const isOnline = useAuthStore((state: AuthStoreState) => state.isOnline)
  const initialize = useAuthStore((state: AuthStoreState) => state.initialize)
  const login = useAuthStore((state: AuthStoreState) => state.login)
  const logout = useAuthStore((state: AuthStoreState) => state.logout)
  const isAdmin = useAuthStore((state: AuthStoreState) => state.isAdmin)

  useEffect(() => {
    initialize()
  }, [initialize])

  return { user, login, logout, isAdmin, isOnline }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => children
export const useAuthContext = useAuth

export const cleanupAuthActivities = () => {
  try {
    const activities = JSON.parse(localStorage.getItem('authActivities') || '[]')
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivities = activities.filter((activity: any) =>
      new Date(activity.timestamp) > thirtyDaysAgo
    )

    localStorage.setItem('authActivities', JSON.stringify(recentActivities))
    console.log('Auth: Activités anciennes nettoyées')
  } catch {
    console.warn('Auth: Erreur nettoyage activités')
  }
}
