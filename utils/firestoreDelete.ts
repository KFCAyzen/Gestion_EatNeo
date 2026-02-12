import { deleteDoc, type DocumentReference } from 'firebase/firestore'

export type DeleteFailureReason =
  | 'offline'
  | 'permission-denied'
  | 'unauthenticated'
  | 'network'
  | 'unknown'

export type DeleteResult = {
  ok: boolean
  reason?: DeleteFailureReason
  code?: string
}

const RETRYABLE_CODES = new Set([
  'unavailable',
  'deadline-exceeded',
  'aborted',
  'resource-exhausted'
])

const normalizeCode = (error: unknown): string => {
  const raw = String((error as { code?: string })?.code || '')
  return raw.replace('firestore/', '')
}

export const getDeleteErrorMessage = (result: DeleteResult): string => {
  if (result.reason === 'offline') {
    return 'Suppression impossible hors ligne. Reconnectez-vous puis réessayez.'
  }
  if (result.reason === 'permission-denied') {
    return 'Permission refusée. Reconnectez-vous avec un compte autorisé.'
  }
  if (result.reason === 'unauthenticated') {
    return 'Session expirée. Reconnectez-vous puis réessayez.'
  }
  if (result.reason === 'network') {
    return 'Réseau instable. Réessayez dans quelques secondes.'
  }
  return 'Erreur lors de la suppression'
}

export const deleteDocWithRetry = async (
  ref: DocumentReference,
  options?: {
    isOnline?: boolean
    maxAttempts?: number
    baseDelayMs?: number
  }
): Promise<DeleteResult> => {
  const isOnline = options?.isOnline ?? true
  const maxAttempts = options?.maxAttempts ?? 3
  const baseDelayMs = options?.baseDelayMs ?? 350

  if (!isOnline) {
    return { ok: false, reason: 'offline' }
  }

  let attempts = 0
  while (attempts < maxAttempts) {
    try {
      await deleteDoc(ref)
      return { ok: true }
    } catch (error) {
      attempts += 1
      const code = normalizeCode(error)
      const canRetry = RETRYABLE_CODES.has(code) && attempts < maxAttempts
      if (canRetry) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempts))
        continue
      }

      if (code === 'permission-denied') {
        return { ok: false, reason: 'permission-denied', code }
      }
      if (code === 'unauthenticated') {
        return { ok: false, reason: 'unauthenticated', code }
      }
      if (code === 'unavailable' || code === 'deadline-exceeded') {
        return { ok: false, reason: 'network', code }
      }
      return { ok: false, reason: 'unknown', code }
    }
  }

  return { ok: false, reason: 'unknown' }
}
