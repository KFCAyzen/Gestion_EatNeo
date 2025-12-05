'use client'

import { useState, useEffect, useMemo } from 'react'
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { formatPrice } from '../utils'

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

export function HistoriqueView() {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [filtreStatut, setFiltreStatut] = useState<string>('tous')
  const [filtrePeriode, setFiltrePeriode] = useState<string>('7j')

  useEffect(() => {
    const q = query(collection(db, 'commandes'), orderBy('dateCommande', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commandesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commande[]
      
      setCommandes(commandesData)
    })

    return () => unsubscribe()
  }, [])

  const commandesFiltrees = useMemo(() => {
    let filtered = commandes

    // Filtre par statut
    if (filtreStatut !== 'tous') {
      filtered = filtered.filter(c => c.statut === filtreStatut)
    }

    // Filtre par période
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (filtrePeriode) {
      case '1j':
        cutoffDate.setDate(now.getDate() - 1)
        break
      case '7j':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30j':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '90j':
        cutoffDate.setDate(now.getDate() - 90)
        break
      default:
        return filtered
    }

    return filtered.filter(c => {
      if (!c.dateCommande || typeof c.dateCommande.toDate !== 'function') {
        return false
      }
      const commandeDate = c.dateCommande.toDate()
      return commandeDate >= cutoffDate
    })
  }, [commandes, filtreStatut, filtrePeriode])

  const stats = useMemo(() => {
    const total = commandesFiltrees.length
    const livrees = commandesFiltrees.filter(c => c.statut === 'livree').length
    const chiffreAffaires = commandesFiltrees
      .filter(c => c.statut === 'livree')
      .reduce((sum, c) => sum + c.total, 0)
    
    return { total, livrees, chiffreAffaires }
  }, [commandesFiltrees])

  return (
    <div className="historique-container">
      <div className="historique-header">
        <h2>Historique des Commandes</h2>
        
        <div className="historique-filters">
          <select 
            value={filtreStatut} 
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="filter-select"
          >
            <option value="tous">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_preparation">En préparation</option>
            <option value="prete">Prête</option>
            <option value="livree">Livrée</option>
          </select>
          
          <select 
            value={filtrePeriode} 
            onChange={(e) => setFiltrePeriode(e.target.value)}
            className="filter-select"
          >
            <option value="1j">Dernières 24h</option>
            <option value="7j">7 derniers jours</option>
            <option value="30j">30 derniers jours</option>
            <option value="90j">90 derniers jours</option>
            <option value="tous">Toutes les périodes</option>
          </select>
        </div>
      </div>

      <div className="historique-stats">
        <div className="stat-card">
          <h3>Total Commandes</h3>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Commandes Livrées</h3>
          <p className="stat-number">{stats.livrees}</p>
        </div>
        <div className="stat-card">
          <h3>Chiffre d'Affaires</h3>
          <p className="stat-number">{formatPrice(stats.chiffreAffaires.toString())}</p>
        </div>
      </div>

      <div className="historique-list">
        {commandesFiltrees.length === 0 ? (
          <div className="empty-state">
            <p>Aucune commande trouvée pour les critères sélectionnés</p>
          </div>
        ) : (
          commandesFiltrees.map(commande => (
            <div key={commande.id} className="commande-card">
              <div className="commande-header">
                <div className="commande-info">
                  <h4>{commande.clientPrenom} {commande.clientNom}</h4>
                  <p className="commande-date">
                    {commande.dateCommande && typeof commande.dateCommande.toDate === 'function' 
                      ? commande.dateCommande.toDate().toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Date inconnue'
                    }
                  </p>
                </div>
                <div className="commande-status">
                  <span className={`status-badge status-${commande.statut}`}>
                    {commande.statut.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="commande-items">
                {commande.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <span className="item-name">{item.nom}</span>
                    <span className="item-quantity">x{item.quantité}</span>
                    <span className="item-price">{item.prix}</span>
                  </div>
                ))}
              </div>
              
              <div className="commande-footer">
                <div className="commande-location">
                  <span>📍 {commande.localisation}</span>
                </div>
                <div className="commande-total">
                  <strong>Total: {formatPrice(commande.total.toString())}</strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}