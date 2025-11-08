'use client'

import React, { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { Icons } from './Icons'
import { useNotifications } from '../hooks/useNotifications'
import { Toast } from './Toast'
import { Modal } from './Modal'
import '../styles/ExpenseManager.css'

interface Expense {
  id: string;
  description: string;
  montant: number;
  categorie: string;
  date: Timestamp;
}

const ExpenseManager: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExpense, setNewExpense] = useState({
    description: '',
    montant: 0,
    categorie: 'ingredients'
  })
  const [loading, setLoading] = useState(false)
  
  // Système de notifications
  const { toasts, modal, showToast, removeToast, showModal, closeModal } = useNotifications();

  // Récupération temps réel des dépenses
  useEffect(() => {
    const q = query(collection(db, 'depenses'), orderBy('date', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[]
      
      setExpenses(expensesData)
    })

    return () => unsubscribe()
  }, [])

  const addExpense = async () => {
    if (!newExpense.description.trim() || newExpense.montant <= 0) {
      showToast('Veuillez remplir tous les champs correctement', 'warning')
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, 'depenses'), {
        description: newExpense.description,
        montant: newExpense.montant,
        categorie: newExpense.categorie,
        date: Timestamp.now()
      })

      setNewExpense({ description: '', montant: 0, categorie: 'ingredients' })
      setShowAddForm(false)
      showToast('Dépense ajoutée avec succès !', 'success')
    } catch (error) {
      console.error('Erreur:', error)
      showToast('Erreur lors de l\'ajout', 'error')
    } finally {
      setLoading(false)
    }
  }

  const deleteExpense = async (id: string) => {
    showModal(
      "Supprimer la dépense",
      "Êtes-vous sûr de vouloir supprimer cette dépense ?",
      "warning",
      async () => {
        try {
          await deleteDoc(doc(db, 'depenses', id))
          showToast('Dépense supprimée !', 'success')
          closeModal()
        } catch (error) {
          console.error('Erreur:', error)
          showToast('Erreur lors de la suppression', 'error')
          closeModal()
        }
      },
      closeModal
    )
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA'
  }

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleString('fr-FR')
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ingredients': return '#4caf50'
      case 'equipement': return '#2196f3'
      case 'personnel': return '#ff9800'
      case 'loyer': return '#9c27b0'
      case 'electricite': return '#ffeb3b'
      case 'autres': return '#607d8b'
      default: return '#666'
    }
  }

  const totalExpenses = expenses.reduce((total, expense) => total + expense.montant, 0)

  const exportExpensesReport = () => {
    const reportContent = `
RAPPORT DES DÉPENSES - EAT NEO
Généré le: ${new Date().toLocaleString('fr-FR')}

RÉSUMÉ:
- Total des dépenses: ${formatCurrency(totalExpenses)}
- Nombre de dépenses: ${expenses.length}

DÉTAIL DES DÉPENSES:
${expenses.map(expense => 
  `${formatDate(expense.date)} | ${expense.description} | ${expense.categorie} | ${formatCurrency(expense.montant)}`
).join('\n')}

NIU: P067500122904X | Email: eatneo@gmail.com | Tél: 696 032 113
    `
    
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-depenses-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const printExpensesReport = () => {
    const printContent = `
      <html>
        <head>
          <title>Rapport des Dépenses - Eat Neo</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2e7d32; padding-bottom: 20px; }
            .header h1 { color: #2e7d32; margin: 0; font-size: 28px; }
            .header p { margin: 5px 0; color: #666; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
            .stat-card { text-align: center; padding: 20px; border: 2px solid #ddd; border-radius: 8px; }
            .stat-card h3 { margin: 0 0 10px 0; color: #2e7d32; }
            .stat-card .number { font-size: 24px; font-weight: bold; margin: 0; color: #d32f2f; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2e7d32; color: white; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Eat Neo - Rapport des Dépenses</h1>
            <p>NIU: P067500122904X | Email: eatneo@gmail.com | Tél: 696 032 113</p>
            <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <h3>Total des Dépenses</h3>
              <p class="number">${formatCurrency(totalExpenses)}</p>
            </div>
            <div class="stat-card">
              <h3>Nombre de Dépenses</h3>
              <p class="number">${expenses.length}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Catégorie</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map(expense => `
                <tr>
                  <td>${formatDate(expense.date)}</td>
                  <td>${expense.description}</td>
                  <td>${expense.categorie}</td>
                  <td>${formatCurrency(expense.montant)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Eat Neo - Système de gestion des dépenses</p>
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="expense-manager">
      <div className="expense-header">
        <h2>Gestion des Dépenses</h2>
        <div className="expense-actions">
          <button onClick={printExpensesReport} className="export-btn print">
            <Icons name="print" />
            Imprimer
          </button>
          <button onClick={exportExpensesReport} className="export-btn download">
            <Icons name="download" />
            Télécharger
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="add-expense-btn"
          >
            <Icons name="plus" />
            Ajouter une dépense
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="expense-stats">
        <div className="stat-card">
          <h3>Total des dépenses</h3>
          <p className="stat-amount">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="stat-card">
          <h3>Nombre de dépenses</h3>
          <p className="stat-count">{expenses.length}</p>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="expense-form-overlay">
          <div className="expense-form">
            <h3>Nouvelle Dépense</h3>
            
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                placeholder="Ex: Achat de riz, Facture électricité..."
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Montant (FCFA):</label>
              <input
                type="number"
                placeholder="0"
                value={newExpense.montant || ''}
                onChange={(e) => setNewExpense({...newExpense, montant: Number(e.target.value)})}
                className="form-input"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Catégorie:</label>
              <select
                value={newExpense.categorie}
                onChange={(e) => setNewExpense({...newExpense, categorie: e.target.value})}
                className="form-select"
              >
                <option value="ingredients">Ingrédients</option>
                <option value="equipement">Équipement</option>
                <option value="personnel">Personnel</option>
                <option value="loyer">Loyer</option>
                <option value="electricite">Électricité/Eau</option>
                <option value="autres">Autres</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                onClick={addExpense}
                disabled={loading}
                className="btn-save"
              >
                {loading ? 'Ajout...' : 'Ajouter'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-cancel"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des dépenses */}
      <div className="expenses-list">
        {expenses.length === 0 ? (
          <div className="no-expenses">
            <p>Aucune dépense enregistrée</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="expense-card">
              <div className="expense-info">
                <div className="expense-main">
                  <h4>{expense.description}</h4>
                  <p className="expense-amount">{formatCurrency(expense.montant)}</p>
                </div>
                <div className="expense-meta">
                  <span 
                    className="expense-category"
                    style={{ backgroundColor: getCategoryColor(expense.categorie) }}
                  >
                    {expense.categorie}
                  </span>
                  <span className="expense-date">
                    {formatDate(expense.date)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteExpense(expense.id)}
                className="delete-expense-btn"
              >
                <Icons name="trash" />
              </button>
            </div>
          ))
        )}
      </div>
      
      {/* Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      
      {modal && (
        <Modal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      )}
    </div>
  )
}

export default ExpenseManager