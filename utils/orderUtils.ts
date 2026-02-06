import { Timestamp } from 'firebase/firestore'

export type OrderStatus = 'en_attente' | 'en_preparation' | 'prete' | 'livree'

export type OrderItem = {
  nom: string
  prix: string
  quantité: number
}

export type OrderData = {
  items: OrderItem[]
  total: number
  clientPrenom: string
  clientNom: string
  clientPhone?: string
  numeroTable: string
  localisation: string
  dateCommande: Timestamp
  statut: OrderStatus
  clientUid?: string
  source?: 'online' | 'offline'
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

  return {
    id,
    items: normalizeItems(data?.items),
    total: parseTotal(data?.total),
    clientPrenom,
    clientNom,
    clientPhone: data?.clientPhone ? String(data.clientPhone) : undefined,
    numeroTable,
    localisation,
    dateCommande: toTimestamp(data?.dateCommande ?? data?.timestamp ?? data?.createdAt),
    statut: normalizeStatus(data?.statut ?? data?.status),
    clientUid: data?.clientUid ? String(data.clientUid) : undefined,
    source: data?.source === 'offline' ? 'offline' : 'online'
  }
}
