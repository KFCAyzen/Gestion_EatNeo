import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

admin.initializeApp()

const db = admin.firestore()

type Role = 'superadmin' | 'admin' | 'user'

const assertSuperAdmin = async (uid?: string) => {
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  const snap = await db.collection('users').doc(uid).get()
  const rawRole = snap.data()?.role as string | undefined
  const role = rawRole === 'employee' ? 'user' : (rawRole as Role | undefined)

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
    const role = snap.data()?.role as Role | undefined
    if (role) rolesByUid.set(snap.id, role)
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

  const email = String(data?.email || '').trim()
  const password = String(data?.password || '').trim()
  const role = (data?.role === 'superadmin'
    ? 'superadmin'
    : data?.role === 'admin'
      ? 'admin'
      : data?.role === 'user' || data?.role === 'employee'
        ? 'user'
        : 'user') as Role
  const displayName = String(data?.displayName || '').trim()

  if (!email || !password) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and password are required')
  }

  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: displayName || undefined
  })

  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email,
    role,
    displayName: displayName || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { uid: userRecord.uid }
})

export const updateUser = functions.https.onCall(async (data: Record<string, unknown>, context: functions.https.CallableContext) => {
  await assertSuperAdmin(context.auth?.uid)

  const uid = String(data?.uid || '').trim()
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'uid is required')
  }

  const authUpdates: admin.auth.UpdateRequest = {}
  if (data?.email) authUpdates.email = String(data.email).trim()
  if (data?.password) authUpdates.password = String(data.password).trim()
  if (data?.displayName !== undefined) authUpdates.displayName = String(data.displayName).trim()
  if (data?.disabled !== undefined) authUpdates.disabled = !!data.disabled

  if (Object.keys(authUpdates).length > 0) {
    await admin.auth().updateUser(uid, authUpdates)
  }

  if (data?.role) {
    const role =
      data.role === 'superadmin'
        ? 'superadmin'
        : data.role === 'admin'
          ? 'admin'
          : data.role === 'user' || data.role === 'employee'
            ? 'user'
            : 'user'
    await db.collection('users').doc(uid).set({ role }, { merge: true })
  }

  return { ok: true }
})

export const deleteUser = functions.https.onCall(async (data: Record<string, unknown>, context: functions.https.CallableContext) => {
  await assertSuperAdmin(context.auth?.uid)

  const uid = String(data?.uid || '').trim()
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'uid is required')
  }

  await admin.auth().deleteUser(uid)
  await db.collection('users').doc(uid).delete()

  return { ok: true }
})
