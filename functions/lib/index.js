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
const zod_1 = require("zod");
const schemas_1 = require("./schemas");
admin.initializeApp();
const db = admin.firestore();
const assertSuperAdmin = async (uid) => {
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const snap = await db.collection('users').doc(uid).get();
    const rawRole = snap.data()?.role;
    const parsedRole = schemas_1.roleSchema.safeParse(rawRole);
    const role = parsedRole.success ? parsedRole.data : undefined;
    if (role !== 'superadmin') {
        throw new functions.https.HttpsError('permission-denied', 'Superadmin role required');
    }
};
exports.listUsers = functions.https.onCall(async (_data, context) => {
    await assertSuperAdmin(context.auth?.uid);
    const result = await admin.auth().listUsers(1000);
    const refs = result.users.map((u) => db.collection('users').doc(u.uid));
    const roleSnaps = refs.length > 0 ? await db.getAll(...refs) : [];
    const rolesByUid = new Map();
    roleSnaps.forEach((snap) => {
        const parsedRole = schemas_1.roleSchema.safeParse(snap.data()?.role);
        if (parsedRole.success)
            rolesByUid.set(snap.id, parsedRole.data);
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
    await assertSuperAdmin(context.auth?.uid);
    let payload;
    try {
        payload = schemas_1.createUserInputSchema.parse(data);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new functions.https.HttpsError('invalid-argument', error.issues.map((issue) => issue.message).join(', '));
        }
        throw error;
    }
    const userRecord = await admin.auth().createUser({
        email: payload.email,
        password: payload.password,
        displayName: payload.displayName || undefined
    });
    await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: payload.email,
        role: payload.role,
        displayName: payload.displayName || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { uid: userRecord.uid };
});
exports.updateUser = functions.https.onCall(async (data, context) => {
    await assertSuperAdmin(context.auth?.uid);
    let payload;
    try {
        payload = schemas_1.updateUserInputSchema.parse(data);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new functions.https.HttpsError('invalid-argument', error.issues.map((issue) => issue.message).join(', '));
        }
        throw error;
    }
    const uid = payload.uid;
    const authUpdates = {};
    if (payload.email)
        authUpdates.email = payload.email;
    if (payload.password)
        authUpdates.password = payload.password;
    if (payload.displayName !== undefined)
        authUpdates.displayName = payload.displayName;
    if (payload.disabled !== undefined)
        authUpdates.disabled = payload.disabled;
    if (Object.keys(authUpdates).length > 0) {
        await admin.auth().updateUser(uid, authUpdates);
    }
    if (payload.role) {
        await db.collection('users').doc(uid).set({ role: payload.role }, { merge: true });
    }
    return { ok: true };
});
exports.deleteUser = functions.https.onCall(async (data, context) => {
    await assertSuperAdmin(context.auth?.uid);
    let payload;
    try {
        payload = schemas_1.deleteUserInputSchema.parse(data);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new functions.https.HttpsError('invalid-argument', error.issues.map((issue) => issue.message).join(', '));
        }
        throw error;
    }
    const uid = payload.uid;
    await admin.auth().deleteUser(uid);
    await db.collection('users').doc(uid).delete();
    return { ok: true };
});
