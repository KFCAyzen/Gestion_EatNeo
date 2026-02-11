'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/components/firebase'

export type UserRole = 'superadmin' | 'admin' | 'user'

export interface User {
  id: string
  username: string
  role: UserRole
  isOffline?: boolean
  lastSync?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isAdmin: () => boolean
  isOnline: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)
const ONLINE_SESSION_KEY = 'currentUserOnline'
const OFFLINE_SESSION_KEY = 'currentUserOffline'

// Utilisateurs prédéfinis - FONCTIONNENT OFFLINE
const offlineUsers = [
  { id: '1', username: 'superadmin', password: 'superadmin123', role: 'superadmin' as UserRole },
  { id: '2', username: 'admin', password: 'admin123', role: 'admin' as UserRole },
  { id: '3', username: 'user', password: 'eatneo123#', role: 'user' as UserRole }
]

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    if (!isOnline) return

    let cancelled = false
    const initPersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch (error) {
        if (!cancelled) {
          console.warn('Auth: impossible de configurer la persistance locale', error)
        }
      }
    }

    void initPersistence()
    return () => {
      cancelled = true
    }
  }, [isOnline])

  // Détection connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Restaurer session hors ligne uniquement
  useEffect(() => {
    if (isOnline) return
    const savedUser = localStorage.getItem(OFFLINE_SESSION_KEY)
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
    }
  }, [isOnline])

  // Restauration session online (fallback UX, l'etat source reste Firebase Auth)
  useEffect(() => {
    if (!isOnline || user) return
    const savedUser = localStorage.getItem(ONLINE_SESSION_KEY)
    if (!savedUser) return
    try {
      const userData = JSON.parse(savedUser) as User
      setUser(userData)
    } catch {
      localStorage.removeItem(ONLINE_SESSION_KEY)
    }
  }, [isOnline, user])

  // Synchronisation avec Firebase Auth (online)
  useEffect(() => {
    if (!isOnline) return

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || firebaseUser.isAnonymous) {
        setUser(null)
        localStorage.removeItem(ONLINE_SESSION_KEY)
        return
      }

      try {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const snapshot = await getDoc(userRef)
        let role: UserRole = 'user'
        let displayName = firebaseUser.displayName || ''

        if (!snapshot.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName,
            role: 'user',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          })
        } else {
          const rawRole = snapshot.data().role as string | undefined
          role = rawRole === 'employee' ? 'user' : (rawRole as UserRole) || 'user'
          displayName = String(snapshot.data().displayName || firebaseUser.displayName || '')
          await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true })
        }

        const userSession: User = {
          id: firebaseUser.uid,
          username: displayName || firebaseUser.email || 'Utilisateur',
          role,
          isOffline: false,
          lastSync: new Date().toISOString()
        }

        setUser(userSession)
        localStorage.setItem(ONLINE_SESSION_KEY, JSON.stringify(userSession))
      } catch (error) {
        console.warn('Auth: Erreur récupération profil utilisateur', error)
      }
    })

    return () => unsubscribe()
  }, [isOnline])

  const login = async (username: string, password: string): Promise<boolean> => {
    if (isOnline) {
      try {
        await setPersistence(auth, browserLocalPersistence)
        await signInWithEmailAndPassword(auth, username, password)

        const loginActivity = {
          userId: username,
          username,
          timestamp: new Date().toISOString(),
          type: 'login',
          mode: 'online'
        }

        const activities = JSON.parse(localStorage.getItem('authActivities') || '[]')
        activities.push(loginActivity)
        localStorage.setItem('authActivities', JSON.stringify(activities))

        console.log(`Auth: Connexion online réussie pour ${username}`)
        return true
      } catch (error) {
        console.warn('Auth: Connexion online échouée', error)
        return false
      }
    }

    // AUTHENTIFICATION OFFLINE
    const foundUser = offlineUsers.find(u => u.username === username && u.password === password)
    if (!foundUser) return false

    const userSession: User = {
      id: foundUser.id,
      username: foundUser.username,
      role: foundUser.role,
      isOffline: true,
      lastSync: undefined
    }

    setUser(userSession)
    localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(userSession))

    const loginActivity = {
      userId: userSession.id,
      username: userSession.username,
      timestamp: new Date().toISOString(),
      type: 'login',
      mode: 'offline'
    }

    const activities = JSON.parse(localStorage.getItem('authActivities') || '[]')
    activities.push(loginActivity)
    localStorage.setItem('authActivities', JSON.stringify(activities))

    console.log(`Auth: Connexion offline réussie pour ${username}`)
    return true
  }

  const logout = async () => {
    if (user) {
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

    if (isOnline) {
      try {
        await signOut(auth)
      } catch (error) {
        console.warn('Auth: Erreur lors de la déconnexion Firebase', error)
      }
    }

    setUser(null)
    localStorage.removeItem(OFFLINE_SESSION_KEY)
    localStorage.removeItem(ONLINE_SESSION_KEY)

    console.log('Auth: Déconnexion effectuée')
  }

  const isAdmin = (): boolean => {
    return user?.role === 'admin' || user?.role === 'superadmin'
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
