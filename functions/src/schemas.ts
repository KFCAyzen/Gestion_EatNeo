import { z } from 'zod'

export const roleSchema = z.enum(['superadmin', 'admin', 'user', 'employee']).transform((value) =>
  value === 'employee' ? 'user' : value
)
export type Role = z.infer<typeof roleSchema>

export const createUserInputSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(6),
  role: roleSchema.optional().default('user'),
  displayName: z.string().trim().optional().default('')
})

export const updateUserInputSchema = z.object({
  uid: z.string().trim().min(1),
  email: z.string().trim().email().optional(),
  password: z.string().trim().min(6).optional(),
  displayName: z.string().trim().optional(),
  disabled: z.boolean().optional(),
  role: roleSchema.optional()
})

export const deleteUserInputSchema = z.object({
  uid: z.string().trim().min(1)
})
