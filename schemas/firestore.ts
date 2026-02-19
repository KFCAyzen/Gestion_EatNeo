import { z } from 'zod'

const trimmedString = z.string().trim()
const optionalTrimmedString = z.string().trim().optional()

export const userRoleSchema = z.enum(['superadmin', 'admin', 'user'])
export type UserRole = z.infer<typeof userRoleSchema>

export const orderStatusSchema = z.enum(['en_attente', 'en_preparation', 'prete', 'livree'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderItemSchema = z.object({
  nom: trimmedString.min(1),
  prix: trimmedString.min(1),
  quantité: z.coerce.number().int().min(1)
})
export type OrderItemInput = z.infer<typeof orderItemSchema>

export const orderWriteSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  total: z.coerce.number().min(0),
  clientPrenom: trimmedString.min(1),
  clientNom: trimmedString.default(''),
  clientPhone: optionalTrimmedString,
  numeroTable: trimmedString.min(1),
  localisation: trimmedString.min(1),
  statut: orderStatusSchema.default('en_attente'),
  clientUid: optionalTrimmedString,
  source: z.enum(['online', 'offline']).default('online')
})
export type OrderWriteInput = z.infer<typeof orderWriteSchema>

export const notificationTypeSchema = z.enum([
  'stock_low',
  'stock_out',
  'new_order',
  'order_ready',
  'order_status'
])

export const notificationPrioritySchema = z.enum(['low', 'medium', 'high'])

export const notificationWriteSchema = z.object({
  type: notificationTypeSchema,
  title: trimmedString.min(1),
  message: trimmedString.min(1),
  source: trimmedString.min(1),
  priority: notificationPrioritySchema.default('medium'),
  read: z.boolean().default(false),
  orderId: optionalTrimmedString
})
export type NotificationWriteInput = z.infer<typeof notificationWriteSchema>

export const activityTypeSchema = z.enum(['create', 'update', 'delete', 'status_change'])

export const activityLogWriteSchema = z.object({
  action: trimmedString.min(1),
  entity: trimmedString.min(1),
  entityId: trimmedString.min(1),
  details: trimmedString.min(1),
  type: activityTypeSchema,
  user: trimmedString.min(1).default('Admin')
})
export type ActivityLogWriteInput = z.infer<typeof activityLogWriteSchema>

export const ingredientWriteSchema = z.object({
  nom: trimmedString.min(1),
  quantite: z.coerce.number().min(0),
  unite: trimmedString.min(1),
  seuilAlerte: z.coerce.number().min(0),
  prixUnitaire: z.coerce.number().min(0).optional()
})
export type IngredientWriteInput = z.infer<typeof ingredientWriteSchema>

export const expenseWriteSchema = z.object({
  description: trimmedString.min(1),
  montant: z.coerce.number().positive(),
  categorie: trimmedString.min(1)
})
export type ExpenseWriteInput = z.infer<typeof expenseWriteSchema>
