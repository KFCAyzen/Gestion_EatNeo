'use client'

import { useState, useEffect, useMemo } from 'react'
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { formatPrice } from '../utils'
import type { MenuItem } from '../types'

interface Commande {
  id: string
  items: Array<{
    nom: string
    prix: string
    quantité: number
  }>
  total: number
  dateCommande: Timestamp
  statut: 'en_attente' | 'en_preparation' | 'prete' | 'livree'
}

interface RentabiliteViewProps {
  plats: MenuItem[]
  boissons: MenuItem[]
}

export function RentabiliteView({ plats, boissons }: RentabiliteViewProps) {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [filtrePeriode, setFiltrePeriode] = useState<string>('30j')

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
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (filtrePeriode) {
      case '7j':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30j':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '90j':
        cutoffDate.setDate(now.getDate() - 90)
        break
      case '365j':
        cutoffDate.setDate(now.getDate() - 365)
        break
      default:
        return commandes.filter(c => c.statut === 'livree')
    }

    return commandes.filter(c => {
      const commandeDate = c.dateCommande.toDate()
      return commandeDate >= cutoffDate && c.statut === 'livree'
    })
  }, [commandes, filtrePeriode])

  const statsGlobales = useMemo(() => {
    const totalCommandes = commandesFiltrees.length
    const chiffreAffaires = commandesFiltrees.reduce((sum, c) => sum + c.total, 0)
    const panierMoyen = totalCommandes > 0 ? chiffreAffaires / totalCommandes : 0
    
    return { totalCommandes, chiffreAffaires, panierMoyen }
  }, [commandesFiltrees])

  const statsParProduit = useMemo(() => {
    const stats: Record<string, { quantite: number; chiffre: number; prix: string }> = {}
    
    commandesFiltrees.forEach(commande => {
      commande.items.forEach(item => {
        if (!stats[item.nom]) {
          stats[item.nom] = { quantite: 0, chiffre: 0, prix: item.prix }
        }
        stats[item.nom].quantite += item.quantité
        
        // Calculer le prix unitaire
        const prixUnitaire = parseFloat(item.prix.replace(/[^\d,.-]/g, '').replace(',', '.'))
        stats[item.nom].chiffre += prixUnitaire * item.quantité
      })
    })
    
    return Object.entries(stats)
      .map(([nom, data]) => ({ nom, ...data }))
      .sort((a, b) => b.chiffre - a.chiffre)
  }, [commandesFiltrees])

  const statsParCategorie = useMemo(() => {
    const allItems = [...plats, ...boissons]
    const categories: Record<string, { quantite: number; chiffre: number }> = {}
    
    commandesFiltrees.forEach(commande => {
      commande.items.forEach(item => {
        const menuItem = allItems.find(mi => mi.nom === item.nom)
        const categorie = menuItem?.filtre?.[0] || 'Autre'
        
        if (!categories[categorie]) {
          categories[categorie] = { quantite: 0, chiffre: 0 }
        }
        
        categories[categorie].quantite += item.quantité
        const prixUnitaire = parseFloat(item.prix.replace(/[^\d,.-]/g, '').replace(',', '.'))
        categories[categorie].chiffre += prixUnitaire * item.quantité
      })
    })
    
    return Object.entries(categories)
      .map(([nom, data]) => ({ nom, ...data }))
      .sort((a, b) => b.chiffre - a.chiffre)
  }, [commandesFiltrees, plats, boissons])

  const evolutionChiffre = useMemo(() => {
    const evolution: Record<string, number> = {}
    
    commandesFiltrees.forEach(commande => {
      const date = commande.dateCommande.toDate().toLocaleDateString('fr-FR')
      if (!evolution[date]) {
        evolution[date] = 0
      }
      evolution[date] += commande.total
    })
    
    return Object.entries(evolution)
      .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime())
      .slice(-30) // Derniers 30 jours
  }, [commandesFiltrees])

  return (
    <div className="rentabilite-container">
      <div className="rentabilite-header">
        <h2>Analyse de Rentabilité</h2>
        
        <select 
          value={filtrePeriode} 
          onChange={(e) => setFiltrePeriode(e.target.value)}
          className="filter-select"
        >
          <option value="7j">7 derniers jours</option>
          <option value="30j">30 derniers jours</option>
          <option value="90j">90 derniers jours</option>
          <option value="365j">Dernière année</option>
          <option value="tous">Toutes les périodes</option>
        </select>
      </div>

      <div className="rentabilite-stats-grid">
        <div className="stat-card">
          <h3>Commandes Livrées</h3>
          <p className="stat-number">{statsGlobales.totalCommandes}</p>
        </div>
        <div className="stat-card">
          <h3>Chiffre d'Affaires</h3>
          <p className="stat-number">{formatPrice(statsGlobales.chiffreAffaires.toString())}</p>
        </div>
        <div className="stat-card">
          <h3>Panier Moyen</h3>
          <p className="stat-number">{formatPrice(statsGlobales.panierMoyen.toString())}</p>
        </div>
      </div>

      <div className="rentabilite-sections">
        <div className="section">
          <h3>Top Produits</h3>
          <div className="produits-list">
            {statsParProduit.slice(0, 10).map((produit, index) => (
              <div key={produit.nom} className="produit-row">
                <span className="produit-rank">#{index + 1}</span>
                <span className="produit-name">{produit.nom}</span>
                <span className="produit-quantity">{produit.quantite} vendus</span>
                <span className="produit-revenue">{formatPrice(produit.chiffre.toString())}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>Performance par Catégorie</h3>
          <div className="categories-list">
            {statsParCategorie.map(categorie => (
              <div key={categorie.nom} className="categorie-row">
                <span className="categorie-name">{categorie.nom}</span>
                <span className="categorie-quantity">{categorie.quantite} items</span>
                <span className="categorie-revenue">{formatPrice(categorie.chiffre.toString())}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>Évolution du Chiffre d'Affaires (30 derniers jours)</h3>
          <div className="evolution-chart">
            {evolutionChiffre.length === 0 ? (
              <p className="no-data">Aucune donnée disponible</p>
            ) : (
              <div className="chart-bars">
                {evolutionChiffre.map(([date, montant]) => (
                  <div key={date} className="chart-bar">
                    <div 
                      className="bar" 
                      style={{ 
                        height: `${Math.max(10, (montant / Math.max(...evolutionChiffre.map(([, m]) => m))) * 100)}px` 
                      }}
                      title={`${date}: ${formatPrice(montant.toString())}`}
                    ></div>
                    <span className="bar-label">{date.split('/')[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}