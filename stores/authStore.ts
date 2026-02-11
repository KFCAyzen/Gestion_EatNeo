'use client'

import { create } from 'zustand'
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

export type AuthStoreState = {
  user: User | null
  isOnline: boolean
  initialized: boolean
  initialize: () => void
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isAdmin: () => boolean
}

const ONLINE_SESSION_KEY = 'currentUserOnline'
const OFFLINE_SESSION_KEY = 'currentUserOffline'

const offlineUsers = [
  { id: '1', username: 'superadmin', password: 'superadmin123', role: 'superadmin' as UserRole },
  { id: '2', username: 'admin', password: 'admin123', role: 'admin' as UserRole },
  { id: '3', username: 'user', password: 'eatneo123#', role: 'user' as UserRole }
]

let authUnsubscribe: (() => void) | null = null
let listenersAttached = false
let persistenceConfigured = false

const configurePersistence = async () => {
  if (persistenceConfigured) return
  try {
    await setPersistence(auth, browserLocalPersistence)
    persistenceConfigured = true
  } catch (error) {
    console.warn('Auth: impossible de configurer la persistance locale', error)
  }
}

const pushAuthActivity = (activity: {
  userId: string
  username: string
  timestamp: string
  type: 'login' | 'logout'
  mode: 'online' | 'offline'
}) => {
  try {
    const activities = JSON.parse(localStorage.getItem('authActivities') || '[]')
    activities.push(activity)
    localStorage.setItem('authActivities', JSON.stringify(activities))
  } catch {
    // No-op: activity log should never block auth flows
  }
}

const hydrateSessionFromStorage = (isOnline: boolean): User | null => {
  const key = isOnline ? ONLINE_SESSION_KEY : OFFLINE_SESSION_KEY
  const savedUser = localStorage.getItem(key)
  if (!savedUser) return null
  try {
    return JSON.parse(savedUser) as User
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

const startAuthListener = (set: (partial: Partial<AuthStoreState>) => void) => {
  if (authUnsubscribe) return

  authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    const isOnlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (!isOnlineNow) return

    if (!firebaseUser || firebaseUser.isAnonymous) {
      set({ user: null })
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

      set({ user: userSession })
      localStorage.setItem(ONLINE_SESSION_KEY, JSON.stringify(userSession))
    } catch (error) {
      console.warn('Auth: Erreur récupération profil utilisateur', error)
    }
  })
}

export const useAuthStore = create<AuthStoreState>((
  set: (partial: Partial<AuthStoreState>) => void,
  get: () => AuthStoreState
) => ({
  user: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  initialized: false,

  initialize: () => {
    if (get().initialized) return
    set({ initialized: true })

    if (typeof window === 'undefined') return

    const isOnlineNow = navigator.onLine
    set({ isOnline: isOnlineNow, user: hydrateSessionFromStorage(isOnlineNow) })

    if (isOnlineNow) {
      void configurePersistence()
      startAuthListener(set)
    }

    if (!listenersAttached) {
      const handleOnline = () => {
        set({ isOnline: true, user: hydrateSessionFromStorage(true) })
        void configurePersistence()
        startAuthListener(set)
      }
      const handleOffline = () => {
        set({ isOnline: false, user: hydrateSessionFromStorage(false) })
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      listenersAttached = true
    }
  },

  login: async (username: string, password: string) => {
    if (get().isOnline) {
      try {
        await configurePersistence()
        await signInWithEmailAndPassword(auth, username, password)

        pushAuthActivity({
          userId: username,
          username,
          timestamp: new Date().toISOString(),
          type: 'login',
          mode: 'online'
        })

        console.log(`Auth: Connexion online réussie pour ${username}`)
        return true
      } catch (error) {
        console.warn('Auth: Connexion online échouée', error)
        return false
      }
    }

    const foundUser = offlineUsers.find(u => u.username === username && u.password === password)
    if (!foundUser) return false

    const userSession: User = {
      id: foundUser.id,
      username: foundUser.username,
      role: foundUser.role,
      isOffline: true,
      lastSync: undefined
    }

    set({ user: userSession })
    localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(userSession))

    pushAuthActivity({
      userId: userSession.id,
      username: userSession.username,
      timestamp: new Date().toISOString(),
      type: 'login',
      mode: 'offline'
    })

    console.log(`Auth: Connexion offline réussie pour ${username}`)
    return true
  },

  logout: async () => {
    const currentUser = get().user
    const isOnline = get().isOnline

    if (currentUser) {
      pushAuthActivity({
        userId: currentUser.id,
        username: currentUser.username,
        timestamp: new Date().toISOString(),
        type: 'logout',
        mode: isOnline ? 'online' : 'offline'
      })
    }

    if (isOnline) {
      try {
        await signOut(auth)
      } catch (error) {
        console.warn('Auth: Erreur lors de la déconnexion Firebase', error)
      }
    }

    set({ user: null })
    localStorage.removeItem(OFFLINE_SESSION_KEY)
    localStorage.removeItem(ONLINE_SESSION_KEY)

    console.log('Auth: Déconnexion effectuée')
  },

  isAdmin: () => {
    const role = get().user?.role
    return role === 'admin' || role === 'superadmin'
  }
}))
