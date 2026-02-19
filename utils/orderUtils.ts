import { Timestamp } from 'firebase/firestore'
import { orderStatusSchema, orderWriteSchema, type OrderWriteInput } from '@/schemas/firestore'

export type OrderStatus = ReturnType<typeof orderStatusSchema.parse>

export type OrderItem = {
  nom: string
  prix: string
  quantité: number
}

export type OrderData = OrderWriteInput & {
  dateCommande: Timestamp
}

export type Order = OrderData & { id: string }

const toTimestamp = (value: any): Timestamp => {
  if (value instanceof Timestamp) return value
  if (value?.toDate) return value as Timestamp
  if (typeof value === 'number') return Timestamp.fromMillis(value)
  if (typeof value === 'string' && value.trim()) return Timestamp.fromDate(new Date(value))
  return Timestamp.now()
}

export const parseTotal = (value: any): number => {
  if (typeof value === 'number') return isNaN(value) ? 0 : value
  if (typeof value === 'string') {
    const parsed = parseInt(value.replace(/[^\d]/g, ''), 10)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

const normalizeItems = (items: any[] = []): OrderItem[] => {
  return items.map((item) => ({
    nom: String(item?.nom ?? ''),
    prix: String(item?.prix ?? ''),
    quantité: Number(item?.quantité ?? item?.quantite ?? item?.quantity ?? 1)
  }))
}

const splitName = (fullName: string) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean)
  return {
    prenom: parts[0] || 'Client',
    nom: parts.slice(1).join(' ')
  }
}

const normalizeStatus = (value: any): OrderStatus => {
  const raw = String(value || '').toLowerCase()
  switch (raw) {
    case 'en_attente':
    case 'en_preparation':
    case 'prete':
    case 'livree':
      return raw
    case 'pret':
      return 'prete'
    case 'livre':
      return 'livree'
    default:
      return 'en_attente'
  }
}

export const normalizeOrder = (id: string, data: any): Order => {
  const nameFallback = splitName(data?.clientName || '')

  const clientPrenom = String(data?.clientPrenom ?? nameFallback.prenom ?? 'Client')
  const clientNom = String(data?.clientNom ?? nameFallback.nom ?? '')
  const numeroTable = String(data?.numeroTable ?? '')
  const localisation = String(data?.localisation ?? (numeroTable ? `Table ${numeroTable}` : ''))

  const parsed = orderWriteSchema.safeParse({
    items: normalizeItems(data?.items),
    total: parseTotal(data?.total),
    clientPrenom,
    clientNom,
    clientPhone: data?.clientPhone ? String(data.clientPhone) : undefined,
    numeroTable,
    localisation,
    statut: normalizeStatus(data?.statut ?? data?.status),
    clientUid: data?.clientUid ? String(data.clientUid) : undefined,
    source: data?.source === 'offline' ? 'offline' : 'online'
  })

  const fallback: OrderWriteInput = {
    items: [],
    total: 0,
    clientPrenom: 'Client',
    clientNom: '',
    numeroTable: '',
    localisation: '',
    statut: 'en_attente',
    source: 'online'
  }

  return {
    id,
    ...(parsed.success ? parsed.data : fallback),
    dateCommande: toTimestamp(data?.dateCommande ?? data?.timestamp ?? data?.createdAt)
  }
}
