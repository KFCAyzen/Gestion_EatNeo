'use client'

import { useState, useEffect, createContext, useContext } from 'react'

export type UserRole = 'admin' | 'employee'

export interface User {
  id: string
  username: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => boolean
  logout: () => void
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Utilisateurs prédéfinis
const users = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin' as UserRole },
  { id: '2', username: 'user', password: 'eatneo123#', role: 'employee' as UserRole }
]

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = (username: string, password: string): boolean => {
    const foundUser = users.find(u => u.username === username && u.password === password)
    if (foundUser) {
      const userSession = { id: foundUser.id, username: foundUser.username, role: foundUser.role }
      setUser(userSession)
      localStorage.setItem('currentUser', JSON.stringify(userSession))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  const isAdmin = (): boolean => {
    return user?.role === 'admin'
  }

  return { user, login, logout, isAdmin }
}

export const AuthProvider = AuthContext.Provider
export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}