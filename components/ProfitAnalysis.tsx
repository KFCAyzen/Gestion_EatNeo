'use client'

import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { Icons } from './Icons'
import ExpenseManager from './ExpenseManager'
import '../styles/ProfitAnalysis.css'

interface ProfitData {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  ordersCount: number;
  expensesCount: number;
  ordersDetails: any[];
  expensesDetails: any[];
}

const ProfitAnalysis: React.FC = () => {
  const [activeView, setActiveView] = useState<'analysis' | 'expenses'>('analysis')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [profitData, setProfitData] = useState<ProfitData | null>(null)
  const [loading, setLoading] = useState(false)

  const calculateProfit = async () => {
    if (!startDate || !endDate) return

    setLoading(true)
    try {
      const start = Timestamp.fromDate(new Date(startDate))
      const end = Timestamp.fromDate(new Date(endDate + 'T23:59:59'))

      // Récupérer les commandes livrées
      const ordersQuery = query(
        collection(db, 'commandes'),
        where('statut', '==', 'livree')
      )
      const ordersSnapshot = await getDocs(ordersQuery)
      
      let totalRevenue = 0
      let ordersInPeriod = 0
      const ordersDetails: any[] = []
      ordersSnapshot.forEach(doc => {
        const data = doc.data()
        const orderDate = data.dateCommande
        if (orderDate && orderDate >= start && orderDate <= end) {
          totalRevenue += data.total || 0
          ordersInPeriod++
          ordersDetails.push({
            id: doc.id,
            date: orderDate,
            client: data.clientPrenom || 'Client',
            table: data.numeroTable || data.localisation || 'N/A',
            items: data.items || [],
            total: data.total || 0
          })
        }
      })

      // Récupérer les dépenses
      const expensesQuery = query(collection(db, 'depenses'))
      const expensesSnapshot = await getDocs(expensesQuery)
      
      let totalExpenses = 0
      let expensesInPeriod = 0
      const expensesDetails: any[] = []
      expensesSnapshot.forEach(doc => {
        const data = doc.data()
        const expenseDate = data.date
        if (expenseDate && expenseDate >= start && expenseDate <= end) {
          totalExpenses += data.montant || 0
          expensesInPeriod++
          expensesDetails.push({
            id: doc.id,
            date: expenseDate,
            description: data.description || 'Dépense',
            categorie: data.categorie || 'autres',
            montant: data.montant || 0
          })
        }
      })

      const profit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

      setProfitData({
        totalRevenue,
        totalExpenses,
        profit,
        profitMargin,
        ordersCount: ordersInPeriod,
        expensesCount: expensesInPeriod,
        ordersDetails,
        expensesDetails
      })
    } catch (error) {
      console.error('Erreur lors du calcul:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA'
  }



  const generateReportContent = () => {
    if (!profitData) return ''

    const averageOrderValue = profitData.ordersCount > 0 ? profitData.totalRevenue / profitData.ordersCount : 0
    const averageExpenseValue = profitData.expensesCount > 0 ? profitData.totalExpenses / profitData.expensesCount : 0
    const profitPerOrder = profitData.ordersCount > 0 ? profitData.profit / profitData.ordersCount : 0

    // Analyser les dépenses par catégorie
    const expensesByCategory = profitData.expensesDetails.reduce((acc: any, expense) => {
      const cat = expense.categorie || 'autres'
      acc[cat] = (acc[cat] || 0) + expense.montant
      return acc
    }, {})

    // Analyser les plats les plus vendus
    const itemsSold = profitData.ordersDetails.reduce((acc: any, order) => {
      order.items.forEach((item: any) => {
        const name = item.nom || 'Article'
        acc[name] = (acc[name] || 0) + (item.quantité || 1)
      })
      return acc
    }, {})

    const topItems = Object.entries(itemsSold)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 5)

    return `
I. ANALYSE DES REVENUS
────────────────────────────────────────────────────────────────
Nombre de commandes livrées: ${profitData.ordersCount}
Chiffre d'affaires total: ${formatCurrency(profitData.totalRevenue)}
Valeur moyenne par commande: ${formatCurrency(averageOrderValue)}
Revenu quotidien moyen: ${formatCurrency(profitData.totalRevenue / Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))))}

II. DÉTAIL DES COMMANDES LIVRÉES
────────────────────────────────────────────────────────────────
${profitData.ordersDetails.map(order => 
  `${order.date.toDate().toLocaleDateString('fr-FR')} | ${order.client} (Table ${order.table}) | ${formatCurrency(order.total)}\n    Articles: ${order.items.map((item: any) => `${item.nom} x${item.quantité}`).join(', ')}`
).join('\n\n')}

III. ARTICLES LES PLUS VENDUS
────────────────────────────────────────────────────────────────
${topItems.map(([name, qty]: any, index) => `${index + 1}. ${name}: ${qty} unités`).join('\n')}

IV. ANALYSE DES CHARGES
────────────────────────────────────────────────────────────────
Nombre de dépenses: ${profitData.expensesCount}
Total des charges: ${formatCurrency(profitData.totalExpenses)}
Charge moyenne: ${formatCurrency(averageExpenseValue)}
Ratio charges/CA: ${profitData.totalRevenue > 0 ? ((profitData.totalExpenses / profitData.totalRevenue) * 100).toFixed(1) : 'N/A'}%

V. RÉPARTITION DES CHARGES PAR CATÉGORIE
────────────────────────────────────────────────────────────────
${Object.entries(expensesByCategory).map(([cat, amount]: any) => 
  `${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${formatCurrency(amount)} (${((amount / profitData.totalExpenses) * 100).toFixed(1)}%)`
).join('\n')}

VI. DÉTAIL DES CHARGES
────────────────────────────────────────────────────────────────
${profitData.expensesDetails.map(expense => 
  `${expense.date.toDate().toLocaleDateString('fr-FR')} | ${expense.categorie} | ${formatCurrency(expense.montant)}\n    Description: ${expense.description}`
).join('\n\n')}

VII. INDICATEURS DE PERFORMANCE
────────────────────────────────────────────────────────────────
Résultat par commande: ${formatCurrency(profitPerOrder)}
Seuil de rentabilité: ${profitData.totalExpenses > 0 ? Math.ceil(profitData.totalExpenses / averageOrderValue) : 0} commandes
Taux de couverture des charges: ${profitData.totalExpenses > 0 ? ((profitData.totalRevenue / profitData.totalExpenses) * 100).toFixed(1) : 'N/A'}%

VIII. RECOMMANDATIONS
────────────────────────────────────────────────────────────────
${profitData.profit < 0 ? 
  'PRIORITÉ ÉLEVÉE:\n- Réduction immédiate des charges\n- Révision de la politique tarifaire\n- Optimisation des processus opérationnels' : 
  profitData.profitMargin < 20 ? 
    'ACTIONS RECOMMANDÉES:\n- Optimisation des coûts variables\n- Ajustement marginal des prix\n- Surveillance renforcée des charges' :
    'MAINTIEN DE LA PERFORMANCE:\n- Conservation des standards de qualité\n- Investissement dans le développement\n- Surveillance continue des indicateurs'
}

────────────────────────────────────────────────────────────────
Fin du rapport - ${new Date().toLocaleDateString('fr-FR')}
────────────────────────────────────────────────────────────────
    `
  }

  const downloadReport = () => {
    const reportContent = generateReportContent()
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-rentabilite-detaille-${startDate}-${endDate}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const printReport = () => {
    if (!profitData) return
    
    const reportContent = generateReportContent()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Rapport Financier - Eat Neo</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Times New Roman', serif;
                line-height: 1.4;
                color: #000;
                background: white;
              }
              .container {
                max-width: 210mm;
                margin: 0 auto;
                padding: 25mm;
              }
              .letterhead {
                border-bottom: 3px solid #000;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .report-header {
                text-align: center;
                margin: 40px 0;
              }
              .report-title {
                font-size: 20px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 10px;
              }
              .report-subtitle {
                font-size: 14px;
                color: #666;
              }
              .executive-summary {
                background: #f8f8f8;
                padding: 20px;
                margin: 30px 0;
                border: 1px solid #ddd;
              }
              .summary-title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 15px;
                text-transform: uppercase;
              }
              .metrics-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              .metrics-table th,
              .metrics-table td {
                padding: 12px;
                text-align: left;
                border: 1px solid #ddd;
              }
              .metrics-table th {
                background: #f0f0f0;
                font-weight: bold;
                text-transform: uppercase;
                font-size: 12px;
              }
              .metrics-table td {
                font-size: 14px;
              }
              .amount {
                text-align: right;
                font-weight: bold;
              }
              .positive { color: #006400; }
              .negative { color: #8B0000; }
              .section {
                margin: 30px 0;
                page-break-inside: avoid;
              }
              .section-title {
                font-size: 16px;
                font-weight: bold;
                text-transform: uppercase;
                border-bottom: 2px solid #000;
                padding-bottom: 5px;
                margin-bottom: 15px;
              }
              .content {
                font-size: 12px;
                line-height: 1.6;
              }
              .footer {
                position: fixed;
                bottom: 20mm;
                left: 25mm;
                right: 25mm;
                text-align: center;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 10px;
              }
              @media print {
                .container { padding: 15mm; }
                .section { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="letterhead">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 50%; vertical-align: top;">
                      <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">EAT NEO</div>
                      <div style="font-size: 12px; line-height: 1.4;">
                        NIU: P067500122904X<br>
                        Email: eatneo@gmail.com<br>
                        Tél: 696 032 113
                      </div>
                    </td>
                    <td style="width: 50%; text-align: right; vertical-align: top;">
                      <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">RAPPORT FINANCIER</div>
                      <div style="font-size: 12px; line-height: 1.4;">
                        Période: ${startDate} au ${endDate}<br>
                        Date: ${new Date().toLocaleDateString('fr-FR')}<br>
                        Page: 1/1
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div class="report-header">
                <div class="report-title">Analyse de Rentabilité</div>
              </div>
              
              <div class="executive-summary">
                <div class="summary-title">Résumé Exécutif</div>
                <table class="metrics-table">
                  <tr>
                    <th>Indicateur</th>
                    <th>Valeur</th>
                    <th>Statut</th>
                  </tr>
                  <tr>
                    <td>Chiffre d'Affaires</td>
                    <td class="amount">${formatCurrency(profitData.totalRevenue)}</td>
                    <td>${profitData.ordersCount} commandes</td>
                  </tr>
                  <tr>
                    <td>Charges Totales</td>
                    <td class="amount">${formatCurrency(profitData.totalExpenses)}</td>
                    <td>${profitData.expensesCount} dépenses</td>
                  </tr>
                  <tr>
                    <td>Résultat Net</td>
                    <td class="amount ${profitData.profit >= 0 ? 'positive' : 'negative'}">
                      ${formatCurrency(profitData.profit)}
                    </td>
                    <td class="${profitData.profit >= 0 ? 'positive' : 'negative'}">
                      ${profitData.profit >= 0 ? 'BÉNÉFICE' : 'PERTE'}
                    </td>
                  </tr>
                  <tr>
                    <td>Marge Nette</td>
                    <td class="amount">${profitData.profitMargin.toFixed(2)}%</td>
                    <td>${profitData.profitMargin >= 20 ? 'Excellente' : profitData.profitMargin >= 10 ? 'Correcte' : 'Faible'}</td>
                  </tr>
                </table>
              </div>

              <div class="section">
                <div class="section-title">Analyse Détaillée</div>
                <div class="content">
                  <pre style="font-family: 'Times New Roman', serif; white-space: pre-wrap; font-size: 11px;">${reportContent}</pre>
                </div>
              </div>
            </div>
            
            <div class="footer">
              © ${new Date().getFullYear()} Eat Neo - Document confidentiel
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="profit-analysis">
      <div className="profit-header">
        <div className="profit-nav">
          <button 
            onClick={() => setActiveView('analysis')}
            className={`nav-btn ${activeView === 'analysis' ? 'active' : ''}`}
          >
            Analyse de Rentabilité
          </button>
          <button 
            onClick={() => setActiveView('expenses')}
            className={`nav-btn ${activeView === 'expenses' ? 'active' : ''}`}
          >
            Gestion des Dépenses
          </button>
        </div>
      </div>

      {activeView === 'expenses' ? (
        <ExpenseManager />
      ) : (
        <>
          <div className="analysis-header">
            <h2>Analyse de Rentabilité</h2>
            <p>Calculez votre marge bénéficiaire sur une période donnée</p>
          </div>

      <div className="date-filters">
        <div className="date-input-group">
          <label>Date de début:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="date-input-group">
          <label>Date de fin:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button 
          onClick={calculateProfit}
          disabled={!startDate || !endDate || loading}
          className="calculate-btn"
        >
          {loading ? 'Calcul...' : 'Calculer'}
        </button>
      </div>

      {profitData && (
        <div className="profit-results">
          <div className="results-header">
            <h3>Résultats de l'analyse</h3>
            <div className="export-buttons">
              <button onClick={printReport} className="export-btn print-btn">
                <Icons name="print" />
                Imprimer
              </button>
              <button onClick={downloadReport} className="export-btn download-btn">
                <Icons name="download" />
                Télécharger
              </button>
            </div>
          </div>

          <div className="profit-cards">
            <div className="profit-card revenue">
              <div className="card-icon">
                <Icons name="trending-up" />
              </div>
              <div className="card-content">
                <h4>Revenus</h4>
                <p className="amount" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)' }}>{formatCurrency(profitData.totalRevenue)}</p>
                <p className="details">{profitData.ordersCount} commande{profitData.ordersCount > 1 ? 's' : ''} livrée{profitData.ordersCount > 1 ? 's' : ''}</p>
                <p className="sub-details">Moyenne: {formatCurrency(profitData.ordersCount > 0 ? profitData.totalRevenue / profitData.ordersCount : 0)}/commande</p>
              </div>
            </div>

            <div className="profit-card expenses">
              <div className="card-icon">
                <Icons name="trending-down" />
              </div>
              <div className="card-content">
                <h4>Dépenses</h4>
                <p className="amount" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)' }}>{formatCurrency(profitData.totalExpenses)}</p>
                <p className="details">{profitData.expensesCount} dépense{profitData.expensesCount > 1 ? 's' : ''} enregistrée{profitData.expensesCount > 1 ? 's' : ''}</p>
                <p className="sub-details">Moyenne: {formatCurrency(profitData.expensesCount > 0 ? profitData.totalExpenses / profitData.expensesCount : 0)}/dépense</p>
              </div>
            </div>

            <div className={`profit-card profit ${profitData.profit >= 0 ? 'positive' : 'negative'}`}>
              <div className="card-icon">
                <Icons name={profitData.profit >= 0 ? "check-circle" : "x-circle"} />
              </div>
              <div className="card-content">
                <h4>Bénéfice Net</h4>
                <p className="amount" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)' }}>{formatCurrency(profitData.profit)}</p>
                <p className="details">Marge: {profitData.profitMargin.toFixed(1)}%</p>
                <p className="sub-details">{profitData.ordersCount > 0 ? formatCurrency(profitData.profit / profitData.ordersCount) : '0 FCFA'}/commande</p>
              </div>
            </div>
          </div>

          <div className="profit-summary">
            <h4>Analyse détaillée</h4>
            <div className="summary-content">
              <div className="analysis-grid">
                <div className="analysis-item">
                  <h5>Performance globale</h5>
                  {profitData.profit >= 0 ? (
                    <p className="positive">
                      <Icons name="check-circle" />
                      Restaurant rentable avec {formatCurrency(profitData.profit)} de bénéfice
                    </p>
                  ) : (
                    <p className="negative">
                      <Icons name="alert-triangle" />
                      Perte de {formatCurrency(Math.abs(profitData.profit))} - Action requise
                    </p>
                  )}
                </div>
                
                <div className="analysis-item">
                  <h5>Indicateurs clés</h5>
                  <ul className="metrics-list">
                    <li>Ratio dépenses/revenus: <strong>{profitData.totalRevenue > 0 ? ((profitData.totalExpenses / profitData.totalRevenue) * 100).toFixed(1) : 'N/A'}%</strong></li>
                    <li>Bénéfice par commande: <strong>{formatCurrency(profitData.ordersCount > 0 ? profitData.profit / profitData.ordersCount : 0)}</strong></li>
                    <li>Seuil rentabilité: <strong>{profitData.totalRevenue > 0 && profitData.ordersCount > 0 ? Math.ceil(profitData.totalExpenses / (profitData.totalRevenue / profitData.ordersCount)) : 0} commandes</strong></li>
                  </ul>
                </div>
                
                <div className="analysis-item">
                  <h5>Recommandations</h5>
                  {profitData.profit < 0 ? (
                    <div className="recommendation negative">
                      <Icons name="alert-triangle" />
                      <span>Urgent: Réduire les coûts ou augmenter les prix</span>
                    </div>
                  ) : profitData.profitMargin < 20 ? (
                    <div className="recommendation warning">
                      <Icons name="alert-triangle" />
                      <span>Marge faible: Optimiser l'efficacité opérationnelle</span>
                    </div>
                  ) : (
                    <div className="recommendation positive">
                      <Icons name="check-circle" />
                      <span>Performance satisfaisante: Maintenir la qualité</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="details-section">
            <div className="details-grid">
              <div className="details-card">
                <h4>Détail des Commandes</h4>
                <div className="details-content">
                  {profitData.ordersDetails.length > 0 ? (
                    <div className="orders-breakdown">
                      {profitData.ordersDetails.slice(0, 5).map((order, index) => (
                        <div key={index} className="order-item">
                          <div className="order-header">
                            <span className="order-date">{order.date.toDate().toLocaleDateString('fr-FR')}</span>
                            <span className="order-amount">{formatCurrency(order.total)}</span>
                          </div>
                          <div className="order-details">
                            <span className="order-client">{order.client} ({order.table})</span>
                            <div className="order-items">
                              {order.items.slice(0, 3).map((item: any, i: number) => (
                                <span key={i} className="item-tag">{item.nom} x{item.quantité}</span>
                              ))}
                              {order.items.length > 3 && <span className="more-items">+{order.items.length - 3} autres</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                      {profitData.ordersDetails.length > 5 && (
                        <p className="more-info">+{profitData.ordersDetails.length - 5} autres commandes</p>
                      )}
                    </div>
                  ) : (
                    <p className="no-data">Aucune commande sur cette période</p>
                  )}
                </div>
              </div>

              <div className="details-card">
                <h4>Détail des Dépenses</h4>
                <div className="details-content">
                  {profitData.expensesDetails.length > 0 ? (
                    <div className="expenses-breakdown">
                      {profitData.expensesDetails.slice(0, 5).map((expense, index) => (
                        <div key={index} className="expense-item">
                          <div className="expense-header">
                            <span className="expense-date">{expense.date.toDate().toLocaleDateString('fr-FR')}</span>
                            <span className="expense-amount">{formatCurrency(expense.montant)}</span>
                          </div>
                          <div className="expense-details">
                            <span className="expense-category">{expense.categorie}</span>
                            <span className="expense-description">{expense.description}</span>
                          </div>
                        </div>
                      ))}
                      {profitData.expensesDetails.length > 5 && (
                        <p className="more-info">+{profitData.expensesDetails.length - 5} autres dépenses</p>
                      )}
                    </div>
                  ) : (
                    <p className="no-data">Aucune dépense sur cette période</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

export default ProfitAnalysis