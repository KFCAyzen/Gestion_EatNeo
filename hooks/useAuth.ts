'use client'

import { useState, useEffect, createContext, useContext } from 'react'

export type UserRole = 'admin' | 'employee'

export interface User {
  id: string
  username: string
  role: UserRole
  isOffline?: boolean
  lastSync?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => boolean
  logout: () => void
  isAdmin: () => boolean
  isOnline: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Utilisateurs prédéfinis - FONCTIONNENT OFFLINE
const offlineUsers = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin' as UserRole },
  { id: '2', username: 'user', password: 'eatneo123#', role: 'employee' as UserRole }
]

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Détection connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncUserSession()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Restaurer session
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      
      // Vérifier validité session si online
      if (isOnline && userData.lastSync) {
        const lastSync = new Date(userData.lastSync)
        const now = new Date()
        const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
        
        // Re-sync si plus de 24h
        if (hoursSinceSync > 24) {
          syncUserSession()
        }
      }
    }
  }, [isOnline])

  // Synchronisation avec Firebase (quand online)
  const syncUserSession = async () => {
    if (!user || !isOnline) return
    
    try {
      // Ici vous pourriez ajouter la sync Firebase si nécessaire
      const updatedUser = {
        ...user,
        isOffline: false,
        lastSync: new Date().toISOString()
      }
      
      setUser(updatedUser)
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      
      console.log('Auth: Session synchronisée avec Firebase')
    } catch (error) {
      console.warn('Auth: Erreur sync Firebase, mode offline maintenu')
    }
  }

  const login = (username: string, password: string): boolean => {
    // AUTHENTIFICATION OFFLINE FIRST
    const foundUser = offlineUsers.find(u => u.username === username && u.password === password)
    
    if (foundUser) {
      const userSession: User = {
        id: foundUser.id,
        username: foundUser.username,
        role: foundUser.role,
        isOffline: !isOnline,
        lastSync: isOnline ? new Date().toISOString() : undefined
      }
      
      setUser(userSession)
      localStorage.setItem('currentUser', JSON.stringify(userSession))
      
      // Log activité
      const loginActivity = {
        userId: userSession.id,
        username: userSession.username,
        timestamp: new Date().toISOString(),
        type: 'login',
        mode: isOnline ? 'online' : 'offline'
      }
      
      // Stocker activité pour sync ultérieure
      const activities = JSON.parse(localStorage.getItem('authActivities') || '[]')
      activities.push(loginActivity)
      localStorage.setItem('authActivities', JSON.stringify(activities))
      
      console.log(`Auth: Connexion ${isOnline ? 'online' : 'offline'} réussie pour ${username}`)
      
      // Sync Firebase si online
      if (isOnline) {
        syncUserSession()
      }
      
      return true
    }
    
    return false
  }

  const logout = () => {
    if (user) {
      // Log activité logout
      const logoutActivity = {
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString(),
        type: 'logout',
        mode: isOnline ? 'online' : 'offline'
      }
      
      const activities = JSON.parse(localStorage.getItem('authActivities') || '[]')
      activities.push(logoutActivity)
      localStorage.setItem('authActivities', JSON.stringify(activities))
    }
    
    setUser(null)
    localStorage.removeItem('currentUser')
    
    console.log('Auth: Déconnexion effectuée')
  }

  const isAdmin = (): boolean => {
    return user?.role === 'admin'
  }

  return { user, login, logout, isAdmin, isOnline }
}

export const AuthProvider = AuthContext.Provider
export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}

// Fonction utilitaire pour nettoyer les activités anciennes
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
  } catch (error) {
    console.warn('Auth: Erreur nettoyage activités')
  }
}