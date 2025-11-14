'use client'

import React, { useState, useEffect } from 'react'
import type { MenuItem } from './types'

import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import '@/styles/CartPage.css'
import { images } from './imagesFallback'
import { useNotifications } from '../hooks/useNotifications'
import { useOfflineOrders } from '../hooks/useOfflineOrders'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { Toast } from './Toast'
import { Modal } from './Modal'
import { deductIngredientsFromOrder } from '../utils/stockUtils'

type Props = {
  cartItems: MenuItem[];
  setCartItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  localisation: string | null;
};

const CartPage: React.FC<Props> = ({ cartItems, setCartItems, localisation }) => {

  const [prenom, setPrenom] = useState("");
  const [numeroTable, setNumeroTable] = useState("");
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  
  // Système de notifications
  const { toasts, modal, showToast, removeToast, showModal, closeModal } = useNotifications();
  
  // Système hors ligne
  const { createOrder } = useOfflineOrders();
  const { isOnline, pendingCount } = useOfflineSync();
  interface Commande {
    id: string;
    items: Array<{
      nom: string;
      prix: string;
      quantité: number;
    }>;
    total: number;
    clientNom: string;
    clientPrenom: string;
    localisation: string;
    dateCommande: any;
    statut: 'en_attente' | 'en_preparation' | 'prete' | 'livree';
  }
  
  const [mesCommandes, setMesCommandes] = useState<Commande[]>([]);


  // Écouter les commandes du client
  useEffect(() => {
    if (prenom.trim() && numeroTable.trim()) {
      const q = query(
        collection(db, 'commandes'),
        where('clientPrenom', '==', prenom.trim()),
        where('numeroTable', '==', numeroTable.trim())
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commandes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Commande[];
        // Filtrer pour ne garder que les commandes non livrées et trier par date
        const commandesNonLivrees = commandes
          .filter(cmd => cmd.statut !== 'livree')
          .sort((a, b) => {
            if (!a.dateCommande || !b.dateCommande) return 0;
            return b.dateCommande.toMillis() - a.dateCommande.toMillis();
          });
        setMesCommandes(commandesNonLivrees);
        
        // Afficher la section si il y a des commandes non livrées
      });
      
      return () => unsubscribe();
    } else {
      setMesCommandes([]);
    }
  }, [prenom, numeroTable]);

  // Récupère le prix réel d'un item (string ou tableau)
  const getPrixString = (item: MenuItem) => {
    if (typeof item.prix === "string") return item.prix || "0 FCFA";
    if (Array.isArray(item.prix)) {
      const selected = item.prix.find(p => p.selected) || item.prix[0];
      return selected.value || "0 FCFA";
    }
    return "0 FCFA";
  };

  const getPrixLabel = (item: MenuItem) => {
    if (typeof item.prix === "string") return item.prix;
    if (Array.isArray(item.prix)) {
      const selected = item.prix.find(p => p.selected) || item.prix[0];
      return selected.label;
    }
    return "";
  };

  // Mettre à jour la quantité
  const updateQuantity = (item: MenuItem, delta: number) => {
    setCartItems(prev =>
      prev
        .map(i =>
          i.id === item.id && getPrixString(i) === getPrixString(item)
            ? { ...i, quantité: (i.quantité || 1) + delta }
            : i
        )
        .filter(i => (i.quantité || 1) > 0)
    );
  };

  // Supprimer un item avec fade-out
  const handleRemoveItem = (item: MenuItem) => {
    const uniqueId = `${item.id}-${getPrixString(item)}`;
    setRemovingItemId(uniqueId);

    setTimeout(() => {
      setCartItems(prev =>
        prev.filter(i => !(i.id === item.id && getPrixString(i) === getPrixString(item)))
      );
      setRemovingItemId(null);
    }, 300);
  };

  // Vider le panier
  const handleClearCart = () => {
    showModal(
      "Vider le panier",
      "Es-tu sûr de vouloir vider tout le panier ?",
      "warning",
      () => {
        setCartItems([]);
        localStorage.removeItem("cart");
        showToast("Panier vidé avec succès !", 'success');
      },
      closeModal
    );
  };

  // Calcul du total avec réduction Voisin
  const isVoisin = prenom.toLowerCase().trim() === 'voisin';
  const totalPrix = cartItems.reduce(
    (acc, item) => {
      const prixUnitaire = parsePrix(getPrixString(item));
      const prixAvecReduction = isVoisin ? Math.max(0, prixUnitaire - 500) : prixUnitaire;
      return acc + prixAvecReduction * (item.quantité || 1);
    },
    0
  );

  // Commander via WhatsApp et sauvegarder
  const handleCommander = async () => {
    if (cartItems.length === 0) {
      showToast("Ton panier est vide.", 'warning');
      return;
    }

    if (!numeroTable.trim()) {
      showToast("Veuillez remplir le numéro de table.", 'warning');
      return;
    }

    try {
      // Préparer les données de commande
      const commandeData = {
        items: cartItems.map(item => ({
          nom: String(item.nom || ''),
          prix: String(getPrixString(item) || ''),
          quantité: Number(item.quantité || 1)
        })),
        total: String(formatPrix(totalPrix)),
        clientName: String(prenom.trim() || 'Client'),
        clientPhone: '',
        localisation: String(numeroTable.trim()),
        status: 'en_attente'
      };

      // Sauvegarder (en ligne ou hors ligne)
      if (isOnline) {
        await addDoc(collection(db, 'commandes'), {
          ...commandeData,
          dateCommande: serverTimestamp()
        });
        
        // Déduire automatiquement les ingrédients
        await deductIngredientsFromOrder(cartItems.map(item => ({
          nom: item.nom,
          quantité: item.quantité || 1
        })));
      } else {
        await createOrder(commandeData);
        showToast(`Commande sauvegardée hors ligne. ${pendingCount + 1} commande(s) en attente de synchronisation.`, 'info');
      }
      
      // Commande enregistrée avec succès

      // Envoyer via WhatsApp
      const message = encodeURIComponent(
        `🍽️ *NOUVELLE COMMANDE - EAT NEO*\n\n` +
        `👤 *Client:* ${prenom || 'Client'}\n` +
        `🏷️ *Table:* ${numeroTable}\n` +
        `📍 *Localisation:* ${localisation || "Non spécifiée"}\n\n` +
        `📋 *DÉTAIL DE LA COMMANDE:*\n` +
        `${"─".repeat(30)}\n` +
          cartItems
            .map((item, index) => 
              `${index + 1}. *${item.nom}*\n` +
              `   Quantité: ${item.quantité}\n` +
              `   Prix unitaire: ${isVoisin ? formatPrix(Math.max(0, parsePrix(getPrixString(item)) - 500)) + ' (Réduction Voisin)' : getPrixString(item)}\n` +
              `   Sous-total: ${formatPrix((isVoisin ? Math.max(0, parsePrix(getPrixString(item)) - 500) : parsePrix(getPrixString(item))) * (item.quantité || 1))}\n`
            )
            .join("\n") +
          `${"─".repeat(30)}\n` +
          `💰 *TOTAL GÉNÉRAL: ${formatPrix(totalPrix)}*\n\n` +
          `⏰ Commande passée le ${new Date().toLocaleString('fr-FR')}\n\n` +
          `Merci ! 🙏`
      );

      window.open(`https://wa.link/oa9ot6?text=${message}`, "_blank");
      
      // Vider le panier après commande
      setCartItems([]);
      localStorage.removeItem("cart");
      // Ne pas vider nom/prénom pour permettre le suivi des commandes
      
      showToast(isOnline ? "Commande envoyée avec succès !" : "Commande sauvegardée hors ligne !", 'success');
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la commande:", error);
      
      // Fallback: sauvegarder hors ligne même en cas d'erreur
      try {
        const commandeData = {
          items: cartItems.map(item => ({
            nom: String(item.nom || ''),
            prix: String(getPrixString(item) || ''),
            quantité: Number(item.quantité || 1)
          })),
          total: String(formatPrix(totalPrix)),
          clientName: String(prenom.trim() || 'Client'),
          clientPhone: '',
          localisation: String(numeroTable.trim()),
          status: 'en_attente'
        };
        
        await createOrder(commandeData);
        showToast("Commande sauvegardée hors ligne en raison d'un problème de connexion.", 'warning');
      } catch (offlineError) {
        showToast("Erreur lors de l'enregistrement. La commande WhatsApp va quand même s'ouvrir.", 'error');
      }
      
      // Envoyer quand même via WhatsApp en cas d'erreur Firebase
      const message = encodeURIComponent(
        `🍽️ *NOUVELLE COMMANDE - EAT NEO*\n\n` +
        `👤 *Client:* ${prenom || 'Client'}\n` +
        `🏷️ *Table:* ${numeroTable}\n` +
        `📍 *Localisation:* ${localisation || "Non spécifiée"}\n\n` +
        `📋 *DÉTAIL DE LA COMMANDE:*\n` +
        `${"─".repeat(30)}\n` +
          cartItems
            .map((item, index) => 
              `${index + 1}. *${item.nom}*\n` +
              `   Quantité: ${item.quantité}\n` +
              `   Prix unitaire: ${isVoisin ? formatPrix(Math.max(0, parsePrix(getPrixString(item)) - 500)) + ' (Réduction Voisin)' : getPrixString(item)}\n` +
              `   Sous-total: ${formatPrix((isVoisin ? Math.max(0, parsePrix(getPrixString(item)) - 500) : parsePrix(getPrixString(item))) * (item.quantité || 1))}\n`
            )
            .join("\n") +
          `${"─".repeat(30)}\n` +
          `💰 *TOTAL GÉNÉRAL: ${formatPrix(totalPrix)}*\n\n` +
          `⏰ Commande passée le ${new Date().toLocaleString('fr-FR')}\n\n` +
          `Merci ! 🙏`
      );

      window.open(`https://wa.link/oa9ot6?text=${message}`, "_blank");
    }
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

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleString('fr-FR');
  };

  return (
    <div className="cart-container">
      <h1 className="cart-title">Votre Panier</h1>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p>Votre panier est vide</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => {
              const uniqueId = `${item.id}-${getPrixString(item)}`;
              const isRemoving = removingItemId === uniqueId;

              return (
                <div
                  key={uniqueId}
                  className={`cart-item ${isRemoving ? "fade-out" : ""}`}
                >
                  <div className="cart-item-header">
                    <div className="cart-item-info">
                      <h3>{item.nom}</h3>
                      <div className="cart-item-price">
                        {isVoisin ? (
                          <>
                            <span style={{textDecoration: 'line-through', color: '#999'}}>{getPrixLabel(item)}</span>
                            {' → '}
                            <span style={{color: '#4caf50', fontWeight: 'bold'}}>
                              {formatPrix(Math.max(0, parsePrix(getPrixString(item)) - 500))}
                            </span>
                            {' × '}{item.quantité}
                          </>
                        ) : (
                          `${getPrixLabel(item)} × ${item.quantité}`
                        )}
                      </div>
                    </div>
                    <div className="cart-item-total">
                      {isVoisin ? (
                        formatPrix(Math.max(0, parsePrix(getPrixString(item)) - 500) * (item.quantité || 1))
                      ) : (
                        formatPrix(parsePrix(getPrixString(item)) * (item.quantité || 1))
                      )}
                    </div>
                  </div>
                  
                  <div className="cart-item-controls">
                    <div className="quantity-controls">
                      <button className="quantity-btn" onClick={() => updateQuantity(item, -1)}>-</button>
                      <span className="quantity-display">{item.quantité}</span>
                      <button className="quantity-btn" onClick={() => updateQuantity(item, 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => handleRemoveItem(item)}>
                      <img src={images.trash} alt="Supprimer" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-total">
            <h2>Total : {formatPrix(totalPrix)}</h2>
            {isVoisin && (
              <p style={{color: '#4caf50', fontSize: '14px', marginTop: '5px'}}>
                🎉 Réduction Voisin appliquée : -500 FCFA par plat
              </p>
            )}
          </div>

          <div className="client-form">
            <h3>Informations Client</h3>
            <div className="form-inputs">
              <input
                type="text"
                placeholder="Prénom (optionnel)"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Numéro de table *"
                value={numeroTable}
                onChange={e => setNumeroTable(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="cart-actions">
            <button onClick={handleClearCart} className="btn btn-secondary">
              Vider le panier
            </button>
            <button onClick={handleCommander} className="btn btn-primary">
              Commander
            </button>
          </div>
        </>
      )}
      
      {/* Affichage des commandes du client */}
      {prenom.trim() && numeroTable.trim() && (
        <div className="orders-section">
          <h3 className="orders-title">Mes Commandes en cours</h3>
          {mesCommandes.length === 0 ? (
            <p className="orders-empty">Aucune commande en cours pour la table {numeroTable}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mesCommandes.map((commande) => (
                <div key={commande.id} className="order-card">
                  <div className="order-header">
                    <span className="order-date">
                      {formatDate(commande.dateCommande)}
                    </span>
                    <span 
                      className="order-status"
                      style={{ backgroundColor: getStatutColor(commande.statut) }}
                    >
                      {commande.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="order-total">
                    Total: {formatPrix(commande.total)}
                  </div>
                  <div className="order-details">
                    {commande.items.length} article(s) • {commande.localisation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
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
          onClose={closeModal}
        />
      )}
    </div>
  );
};

function parsePrix(prix: string): number {
  if (!prix || prix.trim() === "") return 0;
  const parsed = parseInt(prix.replace(/[^\d]/g, ""), 10);
  return isNaN(parsed) ? 0 : parsed;
}

function formatPrix(valeur: number): string {
  return valeur.toLocaleString("fr-FR") + " FCFA";
}

export default CartPage;
