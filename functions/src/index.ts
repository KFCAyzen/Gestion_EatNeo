import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { ZodError } from 'zod'
import { createUserInputSchema, deleteUserInputSchema, roleSchema, updateUserInputSchema, type Role } from './schemas'

admin.initializeApp()

const db = admin.firestore()

const assertSuperAdmin = async (uid?: string) => {
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  const snap = await db.collection('users').doc(uid).get()
  const rawRole = snap.data()?.role as string | undefined
  const parsedRole = roleSchema.safeParse(rawRole)
  const role = parsedRole.success ? parsedRole.data : undefined

  if (role !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'Superadmin role required')
  }
}

export const listUsers = functions.https.onCall(async (_data: unknown, context: functions.https.CallableContext) => {
  await assertSuperAdmin(context.auth?.uid)

  const result = await admin.auth().listUsers(1000)
  const refs = result.users.map((u: admin.auth.UserRecord) => db.collection('users').doc(u.uid))
  const roleSnaps = refs.length > 0 ? await db.getAll(...refs) : []
  const rolesByUid = new Map<string, Role>()

  roleSnaps.forEach((snap: admin.firestore.DocumentSnapshot) => {
    const parsedRole = roleSchema.safeParse(snap.data()?.role)
    if (parsedRole.success) rolesByUid.set(snap.id, parsedRole.data)
  })

  const users = result.users.map((u: admin.auth.UserRecord) => ({
    uid: u.uid,
    email: u.email || '',
    displayName: u.displayName || '',
    disabled: !!u.disabled,
    role: rolesByUid.get(u.uid) || 'user'
  }))

  return { users }
})

export const createUser = functions.https.onCall(async (data: Record<string, unknown>, context: functions.https.CallableContext) => {
  await assertSuperAdmin(context.auth?.uid)

  let payload: ReturnType<typeof createUserInputSchema.parse>
  try {
    payload = createUserInputSchema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new functions.https.HttpsError('invalid-argument', error.issues.map((issue) => issue.message).join(', '))
    }
    throw error
  }

  const userRecord = await admin.auth().createUser({
    email: payload.email,
    password: payload.password,
    displayName: payload.displayName || undefined
  })

  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: payload.email,
    role: payload.role,
    displayName: payload.displayName || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { uid: userRecord.uid }
})

export const updateUser = functions.https.onCall(async (data: Record<string, unknown>, context: functions.https.CallableContext) => {
  await assertSuperAdmin(context.auth?.uid)

  let payload: ReturnType<typeof updateUserInputSchema.parse>
  try {
    payload = updateUserInputSchema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new functions.https.HttpsError('invalid-argument', error.issues.map((issue) => issue.message).join(', '))
    }
    throw error
  }

  const uid = payload.uid

  const authUpdates: admin.auth.UpdateRequest = {}
  if (payload.email) authUpdates.email = payload.email
  if (payload.password) authUpdates.password = payload.password
  if (payload.displayName !== undefined) authUpdates.displayName = payload.displayName
  if (payload.disabled !== undefined) authUpdates.disabled = payload.disabled

  if (Object.keys(authUpdates).length > 0) {
    await admin.auth().updateUser(uid, authUpdates)
  }

  if (payload.role) {
    await db.collection('users').doc(uid).set({ role: payload.role }, { merge: true })
  }

  return { ok: true }
})

export const deleteUser = functions.https.onCall(async (data: Record<string, unknown>, context: functions.https.CallableContext) => {
  await assertSuperAdmin(context.auth?.uid)

  let payload: ReturnType<typeof deleteUserInputSchema.parse>
  try {
    payload = deleteUserInputSchema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new functions.https.HttpsError('invalid-argument', error.issues.map((issue) => issue.message).join(', '))
    }
    throw error
  }

  const uid = payload.uid

  await admin.auth().deleteUser(uid)
  await db.collection('users').doc(uid).delete()

  return { ok: true }
})
