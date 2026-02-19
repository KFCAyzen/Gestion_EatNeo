"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserInputSchema = exports.updateUserInputSchema = exports.createUserInputSchema = exports.roleSchema = void 0;
const zod_1 = require("zod");
exports.roleSchema = zod_1.z.enum(['superadmin', 'admin', 'user', 'employee']).transform((value) => value === 'employee' ? 'user' : value);
exports.createUserInputSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email(),
    password: zod_1.z.string().trim().min(6),
    role: exports.roleSchema.optional().default('user'),
    displayName: zod_1.z.string().trim().optional().default('')
});
exports.updateUserInputSchema = zod_1.z.object({
    uid: zod_1.z.string().trim().min(1),
    email: zod_1.z.string().trim().email().optional(),
    password: zod_1.z.string().trim().min(6).optional(),
    displayName: zod_1.z.string().trim().optional(),
    disabled: zod_1.z.boolean().optional(),
    role: exports.roleSchema.optional()
});
exports.deleteUserInputSchema = zod_1.z.object({
    uid: zod_1.z.string().trim().min(1)
});
