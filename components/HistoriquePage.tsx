'use client'

import React, { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, Timestamp, limit } from 'firebase/firestore'
import { db } from './firebase'
import { images } from './imagesFallback'
import { useOfflineOrders } from '../hooks/useOfflineOrders'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { normalizeOrder, type Order } from '../utils/orderUtils'
import jsPDF from 'jspdf'
import '../styles/HistoriquePage.css'

const HistoriquePage: React.FC = () => {
  const HISTORIQUE_LIMIT = 300;
  const [commandes, setCommandes] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Données hors ligne
  const { orders: offlineOrders } = useOfflineOrders();
  const { isOnline } = useOfflineSync();

  const [dataLoading, setDataLoading] = useState(true);
  const [expandedCommandes, setExpandedCommandes] = useState<Set<string>>(new Set());
  const [periodeStats, setPeriodeStats] = useState<'tout' | 'semaine'>('tout');

  // Simuler chargement initial
  useEffect(() => {
    const timer = setTimeout(() => setDataLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOnline) {
      const q = query(
        collection(db, 'commandes'), 
        orderBy('dateCommande', 'desc'),
        limit(HISTORIQUE_LIMIT)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commandesData = snapshot.docs.map(doc => normalizeOrder(doc.id, doc.data()));
        
        // Filtrer seulement les commandes livrées
        const commandesLivrees = commandesData.filter(cmd => cmd.statut === 'livree');
        setCommandes(commandesLivrees);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Mode hors ligne : utiliser les commandes locales
      const localCommandes = offlineOrders.map(order => normalizeOrder(order.id, {
        ...order,
        dateCommande: new Date(order.timestamp)
      }));
      
      setCommandes(localCommandes);
      setLoading(false);
    }
  }, [isOnline, offlineOrders]);

  // En mode hors ligne, afficher toutes les commandes locales
  const commandesFiltrees = isOnline ? 
    commandes : 
    commandes; // Déjà filtrées ci-dessus

  // Commandes de la semaine
  const getCommandesSemaine = () => {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    return commandes.filter(cmd => {
      const cmdDate = cmd.dateCommande.toDate();
      return cmdDate >= weekStart;
    });
  };

  // Statistiques selon la période
  const commandesStats = periodeStats === 'semaine' ? getCommandesSemaine() : commandes;
  const totalCommandes = commandesStats.length;
  const chiffreAffaires = commandesStats.reduce((acc, cmd) => {
    const total = typeof cmd.total === 'string' ? 
      parseInt((cmd.total as string).replace(/[^\d]/g, '')) || 0 : 
      (cmd.total as number) || 0;
    return acc + total;
  }, 0);
  const commandesAujourdhui = commandesStats.filter(cmd => {
    const today = new Date();
    const cmdDate = cmd.dateCommande.toDate();
    return cmdDate.toDateString() === today.toDateString();
  }).length;
  const moyenneCommande = totalCommandes > 0 ? Math.round(chiffreAffaires / totalCommandes) : 0;

  const formatPrix = (valeur: number): string => {
    return valeur.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatPrixPDF = (valeur: number): string => {
    return valeur.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  };

  const formatDate = (timestamp: Timestamp): string => {
    return timestamp.toDate().toLocaleString('fr-FR');
  };

  const getStatutColor = (statut: string): string => {
    switch (statut) {
      case 'en_attente': return '#ff9800';
      case 'en_preparation': return '#2196f3';
      case 'prete': return '#4caf50';
      case 'livree': return '#9e9e9e';
      default: return '#757575';
    }
  };

  const toggleCommande = (commandeId: string) => {
    setExpandedCommandes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commandeId)) {
        newSet.delete(commandeId);
      } else {
        newSet.add(commandeId);
      }
      return newSet;
    });
  };

  const genererPDF = (periode: 'tout' | 'semaine' = 'tout') => {
    const commandesPDF = periode === 'semaine' ? getCommandesSemaine() : commandes;
    const totalPDF = commandesPDF.length;
    const chiffreAffairesPDF = commandesPDF.reduce((acc, cmd) => {
      const total = typeof cmd.total === 'string' ? 
        parseInt((cmd.total as string).replace(/[^\d]/g, '')) || 0 : 
        (cmd.total as number) || 0;
      return acc + total;
    }, 0);
    
    const doc = new jsPDF();
    
    // Titre centré
    doc.setFontSize(18);
    const titre = periode === 'semaine' ? 'Historique - Cette Semaine' : 'Historique des Commandes';
    doc.text(titre, 105, 20, { align: 'center' });
    
    // Statistiques en 3 colonnes
    doc.setFontSize(10);
    doc.rect(20, 35, 50, 25);
    doc.text('Total Commandes', 45, 45, { align: 'center' });
    doc.setFontSize(14);
    doc.text(totalPDF.toString(), 45, 55, { align: 'center' });
    
    doc.setFontSize(10);
    doc.rect(80, 35, 50, 25);
    doc.text('Chiffre d\'Affaires', 105, 45, { align: 'center' });
    doc.setFontSize(12);
    doc.text(formatPrixPDF(chiffreAffairesPDF), 105, 55, { align: 'center' });
    
    doc.setFontSize(10);
    doc.rect(140, 35, 50, 25);
    doc.text('Aujourd\'hui', 165, 45, { align: 'center' });
    doc.setFontSize(14);
    doc.text(commandesAujourdhui.toString(), 165, 55, { align: 'center' });
    
    let yPosition = 80;
    
    commandesPDF.forEach((commande) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.rect(20, yPosition - 5, 170, 30);
      
      doc.setFontSize(12);
      doc.text(`${commande.clientPrenom} ${commande.clientNom}`, 25, yPosition + 5);
      
      doc.setFontSize(9);
      doc.text(`${formatDate(commande.dateCommande)} • ${commande.localisation}`, 25, yPosition + 12);
      
      doc.setFontSize(8);
      doc.text(commande.statut.replace('_', ' ').toUpperCase(), 150, yPosition + 5);
      
      doc.setFontSize(11);
      doc.text(formatPrixPDF(commande.total), 150, yPosition + 15);
      
      if (commande.items.length > 0) {
        doc.setFontSize(8);
        const itemsText = commande.items.slice(0, 2).map(item => 
          `${item.nom} x${item.quantité}`
        ).join(', ');
        const displayText = commande.items.length > 2 ? 
          itemsText + `... (+${commande.items.length - 2})` : itemsText;
        doc.text(displayText, 25, yPosition + 20);
      }
      
      yPosition += 40;
    });
    
    const fileName = periode === 'semaine' ? 'historique-semaine.pdf' : 'historique-commandes.pdf';
    doc.save(fileName);
  };

  if (loading || dataLoading) {
    return (
      <div className="historique-skeleton">
        {/* Header skeleton */}
        <div className="historique-skeleton-header">
          <div className="historique-skeleton-back"></div>
          <div className="historique-skeleton-title"></div>
        </div>
        
        {/* Stats skeleton */}
        <div className="historique-skeleton-stats">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="historique-skeleton-stat">
              <div className="historique-skeleton-stat-title"></div>
              <div className="historique-skeleton-stat-value"></div>
            </div>
          ))}
        </div>
        
        {/* Filter skeleton */}
        <div className="historique-skeleton-filter"></div>
        
        {/* Commandes skeleton */}
        <div className="historique-skeleton-commandes">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="historique-skeleton-commande">
              <div className="historique-skeleton-commande-header">
                <div className="historique-skeleton-commande-client">
                  <div className="historique-skeleton-commande-name"></div>
                  <div className="historique-skeleton-commande-date"></div>
                </div>
                <div>
                  <div className="historique-skeleton-commande-status"></div>
                  <div className="historique-skeleton-commande-total"></div>
                </div>
              </div>
              <div className="historique-skeleton-items">
                <div className="historique-skeleton-item"></div>
                <div className="historique-skeleton-item"></div>
                <div className="historique-skeleton-item"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="historique-container">
      <a href="/admin" className="historique-back-btn">
        <img src={images.backArrow} alt="Retour" style={{ height: '20px', marginRight: '8px' }} />
        Retour à l'administration
      </a>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 className="historique-title" style={{ 
          margin: 0,
          fontSize: 'clamp(1.5rem, 4vw, 2rem)'
        }}>
          Historique des Commandes
          {!isOnline && (
            <span style={{
              fontSize: '0.6em',
              background: '#ff9800',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '10px',
              marginLeft: '10px'
            }}>
              Hors ligne
            </span>
          )}
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => genererPDF('tout')}
            style={{
              backgroundColor: '#7d3837',
              color: 'white',
              border: 'none',
              padding: 'clamp(0.3rem, 2vw, 0.5rem) clamp(0.5rem, 3vw, 1rem)',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
              whiteSpace: 'nowrap'
            }}
          >
            📄 PDF Complet
          </button>
          <button 
            onClick={() => genererPDF('semaine')}
            style={{
              backgroundColor: '#5a2d2c',
              color: 'white',
              border: 'none',
              padding: 'clamp(0.3rem, 2vw, 0.5rem) clamp(0.5rem, 3vw, 1rem)',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
              whiteSpace: 'nowrap'
            }}
          >
            📅 PDF Semaine
          </button>
        </div>
      </div>

      {/* Sélecteur de période pour les statistiques */}
      <div style={{ 
        marginBottom: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <label style={{ 
          color: '#7d3837',
          fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
        }}>Période des statistiques:</label>
        <select 
          value={periodeStats} 
          onChange={(e) => setPeriodeStats(e.target.value as 'tout' | 'semaine')}
          style={{
            padding: 'clamp(0.3rem, 1.5vw, 0.5rem)',
            borderRadius: '5px',
            border: '1px solid #7d3837',
            fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
            minWidth: '150px'
          }}
        >
          <option value="tout">Tout l'historique</option>
          <option value="semaine">Cette semaine</option>
        </select>
      </div>

      {/* Statistiques */}
      <div className="historique-stats">
        <div className="historique-stat-card">
          <h3 className="historique-stat-title">Total Commandes</h3>
          <p className="historique-stat-value">{totalCommandes}</p>
        </div>
        <div className="historique-stat-card">
          <h3 className="historique-stat-title">Chiffre d'Affaires</h3>
          <p className="historique-stat-value">{formatPrix(chiffreAffaires)}</p>
        </div>
        <div className="historique-stat-card">
          <h3 className="historique-stat-title">Moyenne/Commande</h3>
          <p className="historique-stat-value">{formatPrix(moyenneCommande)}</p>
        </div>
        <div className="historique-stat-card">
          <h3 className="historique-stat-title">Aujourd'hui</h3>
          <p className="historique-stat-value">{commandesAujourdhui}</p>
        </div>
      </div>



      {/* Liste des commandes */}
      {commandesFiltrees.length === 0 ? (
        <p className="historique-no-data">Aucune commande trouvée.</p>
      ) : (
        <div className="historique-commandes">
          {commandesFiltrees.map((commande) => {
            const isExpanded = expandedCommandes.has(commande.id);
            return (
              <div 
                key={commande.id} 
                className="historique-commande-card"
                onClick={() => toggleCommande(commande.id)}
              >
                <div className="historique-commande-header">
                  <div className="historique-client-info">
                    <h3>
                      {commande.clientPrenom} {commande.clientNom}
                      <span className={`historique-expand-icon ${isExpanded ? 'expanded' : ''}`}>
                        ▼
                      </span>
                    </h3>
                    <p>
                      {formatDate(commande.dateCommande)} • {commande.localisation}
                    </p>
                  </div>
                  <div className="historique-commande-right">
                    <span 
                      className="historique-commande-status"
                      style={{ backgroundColor: getStatutColor(commande.statut) }}
                    >
                      {commande.statut.replace('_', ' ')}
                    </span>
                    <p className="historique-commande-total">
                      {formatPrix(commande.total)}
                    </p>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="historique-commande-details">
                    <h4 className="historique-items-title">Articles commandés:</h4>
                    <ul className="historique-items-list">
                      {commande.items.map((item, index) => (
                        <li key={index}>
                          {item.nom} × {item.quantité} ({item.prix})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoriquePage;
