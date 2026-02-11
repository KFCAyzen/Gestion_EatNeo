"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.listUsers = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
admin.initializeApp();
const db = admin.firestore();
const assertAdmin = async (uid) => {
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const snap = await db.collection('users').doc(uid).get();
    const rawRole = snap.data()?.role;
    const role = rawRole === 'employee' ? 'user' : rawRole;
    if (role !== 'admin' && role !== 'superadmin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin role required');
    }
};
exports.listUsers = functions.https.onCall(async (_data, context) => {
    await assertAdmin(context.auth?.uid);
    const result = await admin.auth().listUsers(1000);
    const refs = result.users.map((u) => db.collection('users').doc(u.uid));
    const roleSnaps = refs.length > 0 ? await db.getAll(...refs) : [];
    const rolesByUid = new Map();
    roleSnaps.forEach((snap) => {
        const role = snap.data()?.role;
        if (role)
            rolesByUid.set(snap.id, role);
    });
    const users = result.users.map((u) => ({
        uid: u.uid,
        email: u.email || '',
        displayName: u.displayName || '',
        disabled: !!u.disabled,
        role: rolesByUid.get(u.uid) || 'user'
    }));
    return { users };
});
exports.createUser = functions.https.onCall(async (data, context) => {
    await assertAdmin(context.auth?.uid);
    const email = String(data?.email || '').trim();
    const password = String(data?.password || '').trim();
    const role = (data?.role === 'superadmin'
        ? 'superadmin'
        : data?.role === 'admin'
            ? 'admin'
            : data?.role === 'user' || data?.role === 'employee'
                ? 'user'
                : 'user');
    const displayName = String(data?.displayName || '').trim();
    if (!email || !password) {
        throw new functions.https.HttpsError('invalid-argument', 'Email and password are required');
    }
    const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: displayName || undefined
    });
    await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        role,
        displayName: displayName || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { uid: userRecord.uid };
});
exports.updateUser = functions.https.onCall(async (data, context) => {
    await assertAdmin(context.auth?.uid);
    const uid = String(data?.uid || '').trim();
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'uid is required');
    }
    const authUpdates = {};
    if (data?.email)
        authUpdates.email = String(data.email).trim();
    if (data?.password)
        authUpdates.password = String(data.password).trim();
    if (data?.displayName !== undefined)
        authUpdates.displayName = String(data.displayName).trim();
    if (data?.disabled !== undefined)
        authUpdates.disabled = !!data.disabled;
    if (Object.keys(authUpdates).length > 0) {
        await admin.auth().updateUser(uid, authUpdates);
    }
    if (data?.role) {
        const role = data.role === 'superadmin'
            ? 'superadmin'
            : data.role === 'admin'
                ? 'admin'
                : data.role === 'user' || data.role === 'employee'
                    ? 'user'
                    : 'user';
        await db.collection('users').doc(uid).set({ role }, { merge: true });
    }
    return { ok: true };
});
exports.deleteUser = functions.https.onCall(async (data, context) => {
    await assertAdmin(context.auth?.uid);
    const uid = String(data?.uid || '').trim();
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'uid is required');
    }
    await admin.auth().deleteUser(uid);
    await db.collection('users').doc(uid).delete();
    return { ok: true };
});
