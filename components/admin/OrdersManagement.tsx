'use client'

import { useCallback } from 'react'
import { Timestamp } from 'firebase/firestore'

interface Commande {
  id: string
  items: Array<{
    nom: string
    prix: string
    quantité: number
  }>
  total: number
  clientNom: string
  clientPrenom: string
  localisation: string
  dateCommande: Timestamp
  statut: 'en_attente' | 'en_preparation' | 'prete' | 'livree'
}

interface OrdersManagementProps {
  commandes: Commande[]
  onUpdateStatus: (commandeId: string, nouveauStatut: string) => Promise<void>
  onDeleteOrder: (commandeId: string) => Promise<void>
}

export function OrdersManagement({
  commandes,
  onUpdateStatus,
  onDeleteOrder
}: OrdersManagementProps) {
  const formatDate = useCallback((timestamp: Timestamp): string => {
    return timestamp.toDate().toLocaleString('fr-FR')
  }, [])

  const formatPrixCommande = useCallback((valeur: number): string => {
    return valeur.toLocaleString('fr-FR') + ' FCFA'
  }, [])

  const getStatutColor = (statut: string): string => {
    switch (statut) {
      case 'en_attente': return '#ff9800'
      case 'en_preparation': return '#2196f3'
      case 'prete': return '#4caf50'
      case 'livree': return '#9e9e9e'
      default: return '#757575'
    }
  }

  return (
    <div className="commandes-section">
      <h2>Gestion des Commandes</h2>
      
      {commandes.length === 0 ? (
        <p className="commandes-no-data">Aucune commande trouvée.</p>
      ) : (
        <div className="commandes-list">
          {commandes.map((commande) => (
            <div key={commande.id} className="commande-card">
              <div className="commande-header">
                <div className="commande-client">
                  <h3>
                    {commande.clientPrenom} {commande.clientNom}
                  </h3>
                  <p>
                    {formatDate(commande.dateCommande)} • {commande.localisation}
                  </p>
                </div>
                <div className="commande-total">
                  <p>
                    {formatPrixCommande(commande.total)}
                  </p>
                </div>
              </div>
              
              <div className="commande-items">
                <h4>Articles commandés:</h4>
                <ul>
                  {commande.items.map((item, index) => (
                    <li key={index}>
                      {item.nom} × {item.quantité} ({item.prix})
                    </li>
                  ))}
                </ul>
              </div>

              <div className="commande-actions">
                <div className="commande-status-group">
                  <label className="commande-status-label">Statut:</label>
                  <select 
                    value={commande.statut}
                    onChange={(e) => onUpdateStatus(commande.id, e.target.value)}
                    style={{ '--status-color': getStatutColor(commande.statut) } as React.CSSProperties}
                    className="commande-status-select-dynamic"
                  >
                    <option value="en_attente">En attente</option>
                    <option value="en_preparation">En préparation</option>
                    <option value="prete">Prête</option>
                    <option value="livree">Livrée</option>
                  </select>
                </div>
                
                <button
                  onClick={() => onDeleteOrder(commande.id)}
                  className="commande-delete-btn"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}