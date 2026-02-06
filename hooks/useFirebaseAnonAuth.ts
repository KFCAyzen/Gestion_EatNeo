'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth } from '@/components/firebase'

export function useFirebaseAnonAuth() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null)
  const [isReady, setIsReady] = useState<boolean>(!!auth.currentUser)

  useEffect(() => {
    let mounted = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return

      if (!user) {
        try {
          await signInAnonymously(auth)
        } catch (error) {
          console.warn('Auth: échec connexion anonyme', error)
          setUid(null)
          setIsReady(false)
        }
        return
      }

      setUid(user.uid)
      setIsReady(true)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  return { uid, isReady }
}
