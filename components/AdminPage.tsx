'use client'

import { useState, useEffect } from 'react'
import { db, storage } from "./firebase";
import { collection, addDoc, doc, deleteDoc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { uploadImageFromBrowser } from "./upLoadFirebase";
import type { MenuItem } from "./types";
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { useNotifications } from '../hooks/useNotifications';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { Toast } from './Toast';
import { Modal } from './Modal';
import { AdminTabs } from './AdminTabs';
import { MenuForm } from './MenuForm';
import { StockManagement } from './StockManagement';
import { MouvementsStock } from './MouvementsStock';
import { LoadingSpinner, SearchIcon, EditIcon, DeleteIcon, EyeIcon, EyeOffIcon, PlusIcon, MinusIcon, HistoryIcon } from './Icons';
import '@/styles/AdminPage.css'
import { menuItems, drinksItems } from "./types";



interface Ingredient {
  id: string;
  nom: string;
  quantite: number;
  unite: string; // kg, L, pièces, etc.
  prixUnitaire?: number;
  seuilAlerte: number; // Seuil en dessous duquel on alerte
}

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
  dateCommande: Timestamp;
  statut: 'en_attente' | 'en_preparation' | 'prete' | 'livree';
}

interface MouvementStock {
  id: string;
  item: string;
  type: 'entree' | 'sortie' | 'ajustement';
  quantite: number;
  unite: string;
  stockAvant: number;
  stockApres: number;
  description: string;
  date: Timestamp;
  categorie: 'boissons' | 'ingredients';
}
// Convertir une URL Firebase Storage → chemin interne utilisable par ref()
function getStoragePathFromUrl(url: string) {
  const match = url.match(/o\/(.*?)\?alt=media/);
  return match ? decodeURIComponent(match[1]) : "";
}

export default function AdminPage() {
  type PriceOption = { label: string; value: string; selected?: boolean };
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState<PriceOption[]>([]);
  const [categorie, setCategorie] = useState<"plats" | "boissons" | "desserts" | string>("plats");
  const [filtre, setFiltre] = useState<string>(""); // Nouveau champ filtre obligatoire
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<"Plats" | "Boissons" | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'menu' | 'commandes' | 'stock' | 'historique'>('menu');
  const [stockView, setStockView] = useState<'boissons' | 'ingredients'>('boissons');
  const [historiqueView, setHistoriqueView] = useState<'commandes' | 'mouvements'>('commandes');
  const [periodFilter, setPeriodFilter] = useState('month');
  const [typeFilter, setTypeFilter] = useState('all');
  const [mouvements, setMouvements] = useState<any[]>([]);
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  
  // Système de notifications
  const { toasts, modal, showToast, removeToast, showModal, closeModal } = useNotifications();
  const { logActivity, logNotification } = useActivityLogger();
  
  // États pour la gestion des ingrédients
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    nom: '',
    quantite: 0,
    unite: 'kg',
    seuilAlerte: 5
  });
  const [showAddBoisson, setShowAddBoisson] = useState(false);
  const [newBoisson, setNewBoisson] = useState({
    nom: '',
    prix: '',
    stock: 10
  });
  const [commandes, setCommandes] = useState<Commande[]>([]);

  // --- Récupération temps réel des collections ---
  const { items: plats } = useRealtimeCollection("Plats");
  const { items: boissons } = useRealtimeCollection("Boissons");
  const [loading, setLoading] = useState(true);

  // Fonction pour supprimer et re-uploader tous les items avec le champ masque
  const resetAndReuploadItems = async () => {
    if (!window.confirm('Supprimer et re-uploader tous les items ? Cette action est irréversible.')) return;
    
    try {
      // Supprimer toutes les collections
      const collections = ['Plats', 'Boissons'];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        for (const docSnapshot of snapshot.docs) {
          await deleteDoc(doc(db, collectionName, docSnapshot.id));
        }
      }
      
      // Re-uploader les items avec le champ masque
      for (const item of menuItems) {
        await addDoc(collection(db, 'Plats'), {
          ...item,
          masque: false
        });
      }
      
      for (const item of drinksItems) {
        await addDoc(collection(db, 'Boissons'), {
          ...item,
          masque: false
        });
      }
      
      alert('Tous les items ont été re-uploadés avec succès !');
    } catch (error) {
      console.error('Erreur lors du reset:', error);
      alert('Erreur lors du reset');
    }
  };

  // Migration: ajouter les champs masque et stock aux items existants
  const migrateExistingItems = async () => {
    try {
      const collections = ['Plats', 'Boissons'];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          const updates: any = {};
          
          if (data.masque === undefined) {
            updates.masque = false;
          }
          
          if (data.stock === undefined) {
            updates.stock = 10; // Stock initial par défaut
          }
          
          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, collectionName, docSnapshot.id), updates);
          }
        }
      }
      
      console.log('Migration terminée: champs masque et stock ajoutés aux items existants');
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
    }
  };

  // Simuler chargement et effectuer la migration
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      migrateExistingItems();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Récupération temps réel des commandes
  useEffect(() => {
    const q = query(collection(db, 'commandes'), orderBy('dateCommande', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commandesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commande[];
      
      setCommandes(commandesData);
    });

    return () => unsubscribe();
  }, []);

  // Récupération temps réel des ingrédients
  useEffect(() => {
    const q = query(collection(db, 'ingredients'), orderBy('nom'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ingredientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ingredient[];
      
      setIngredients(ingredientsData);
    });

    return () => unsubscribe();
  }, []);

  // Récupération de l'historique des commandes (commandes livrées)
  const [historique, setHistorique] = useState<Commande[]>([]);
  
  useEffect(() => {
    const q = query(
      collection(db, 'commandes'), 
      orderBy('dateCommande', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allCommandes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commande[];
      
      // Filtrer seulement les commandes livrées pour l'historique
      const commandesLivrees = allCommandes.filter(cmd => cmd.statut === 'livree');
      setHistorique(commandesLivrees);
    });

    return () => unsubscribe();
  }, []);

  /* Upload fichier */
  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImageFromBrowser(file, filtre || "general");
      setImageUrl(url);
    } catch {
      setError("Erreur lors de l’upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  /* Gestion des options de prix */
  const addPriceOption = () => setPrix([...prix, { label: "", value: "" }]);
  const updatePriceOption = (index: number, field: "label" | "value", val: string) => {
    const updated = [...prix];
    updated[index][field] = val;
    setPrix(updated);
  };
  const removePriceOption = (index: number) => setPrix(prix.filter((_, i) => i !== index));

  /* Soumission Firestore */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validations
    if (!imageUrl) return alert("Merci d’ajouter une image !");
    // Validations de base
    if (!imageUrl) return alert("Merci d'ajouter une image !");
    if (!nom.trim()) return alert("Merci de renseigner un nom !");
    if (prix.length === 0) return alert("Ajoutez au moins une option de prix !");
    if (prix.some(p => !p.value.trim())) return alert("Chaque option de prix doit avoir une valeur.");
    if (prix.length >= 2 && prix.some(p => !p.label.trim())) return alert("Le label est obligatoire quand il y a plusieurs prix.");
    if (!categorie.trim()) return alert("Merci de renseigner une catégorie !");
    if (!filtre.trim()) return alert("Merci de renseigner un filtre !");

    try {
      // Auto-détection des boissons basée sur le filtre/catégorie
      const drinkKeywords = ['guinness', 'bière', 'vin', 'whisky', 'vodka', 'champagne', 'cocktail', 'jus', 'soda', 'boisson'];
      const isAutoDetectedDrink = drinkKeywords.some(keyword => 
        filtre.toLowerCase().includes(keyword) || nom.toLowerCase().includes(keyword)
      );
      
      const collectionName: "Plats" | "Boissons" = editId 
        ? (editingCollection as any) 
        : (categorie === "boissons" || isAutoDetectedDrink ? "Boissons" : "Plats");
      
      // Validation spécifique à la collection
      if (collectionName === "Plats" && !description.trim()) {
        return alert("Merci de renseigner une description pour les plats !");
      }

      // Si une seule option avec label vide → stocker juste la valeur
      const prixField: string | PriceOption[] =
        prix.length === 1 && prix[0].label === "" ? prix[0].value : prix;

      if (editId) {
        await setDoc(
          doc(db, collectionName, editId),
          {
            nom,
            description,
            prix: prixField,
            catégorie: [filtre],
            filtre: [filtre], // Enregistrement du filtre comme tableau
            image: imageUrl,
            masque: false, // Assurer que le champ masque existe
          },
          { merge: true }
        );
      } else {
        await addDoc(collection(db, collectionName), {
          nom,
          description,
          prix: prixField,
          catégorie: [filtre],
          filtre: [filtre], // Enregistrement du filtre comme tableau
          image: imageUrl,
          masque: false, // Nouveau champ pour tous les nouveaux items
          stock: 10, // Stock initial par défaut
        });
      }

      showToast(editId ? "Item modifié avec succès !" : "Item ajouté avec succès !", 'success');
      // reset formulaire
      setNom("");
      setDescription("");
      setPrix([]);
      setCategorie("plats");
      setFiltre(""); // Reset filtre
      setImageUrl("");
      setEditId(null);
      setEditingCollection(null);
    } catch (err) {
      console.error(err);
      alert(editId ? "Erreur lors de la modification" : "Erreur lors de l’ajout");
    }
  };

  /* Suppression Firestore + Storage */
  const handleDelete = async (collectionName: "Plats" | "Boissons", id: string) => {
    showModal(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cet item ? Cette action est irréversible.",
      "warning",
      async () => {
        try {
          const itemDoc = await getDoc(doc(db, collectionName, id));
          if (itemDoc.exists()) {
            const data = itemDoc.data();
            if (data.image) {
              const path = getStoragePathFromUrl(data.image);
              if (path) await deleteObject(ref(storage, path));
            }
          }
          await deleteDoc(doc(db, collectionName, id));
          showToast("Item supprimé avec succès !", 'success');
        } catch (err) {
          console.error(err);
          showToast("Erreur lors de la suppression", 'error');
        }
        closeModal();
      },
      closeModal
    );
  };

  const formatPrix = (item: MenuItem) =>
    typeof item.prix === "string"
      ? item.prix
      : item.prix.map(p => `${p.label ? p.label + " - " : ""}${p.value}`).join(", ");

  // Fonction pour masquer/afficher un item
  const toggleItemVisibility = async (collectionName: "Plats" | "Boissons", id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, collectionName, id), {
        masque: !currentStatus
      });
      alert(`Item ${!currentStatus ? 'masqué' : 'affiché'} avec succès !`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  // Gestion des commandes
  const updateCommandeStatut = async (commandeId: string, nouveauStatut: string) => {
    try {
      await updateDoc(doc(db, 'commandes', commandeId), {
        statut: nouveauStatut
      });
      showToast('Statut mis à jour avec succès !', 'success');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showToast('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const deleteCommande = async (commandeId: string) => {
    if (!window.confirm('Supprimer cette commande ?')) return;
    try {
      await deleteDoc(doc(db, 'commandes', commandeId));
      alert('Commande supprimée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const formatDate = (timestamp: Timestamp): string => {
    return timestamp.toDate().toLocaleString('fr-FR');
  };

  const formatPrixCommande = (valeur: number): string => {
    return valeur.toLocaleString('fr-FR') + ' FCFA';
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

  // Gestion du stock avec enregistrement des mouvements
  const updateStock = async (collectionName: "Plats" | "Boissons", id: string, newStock: number) => {
    const finalStock = Math.max(0, newStock);
    try {
      // Récupérer l'ancien stock
      const itemDoc = await getDoc(doc(db, collectionName, id));
      if (itemDoc.exists()) {
        const itemData = itemDoc.data();
        const oldStock = itemData.stock || 0;
        
        // Mettre à jour le stock
        await updateDoc(doc(db, collectionName, id), {
          stock: finalStock
        });
        
        // Enregistrer le mouvement si il y a un changement
        if (oldStock !== finalStock) {
          const difference = finalStock - oldStock;
          await logMouvementStock({
            item: itemData.nom,
            type: difference > 0 ? 'entree' : 'sortie',
            quantite: Math.abs(difference),
            unite: 'unités',
            stockAvant: oldStock,
            stockApres: finalStock,
            description: `Ajustement manuel du stock`,
            categorie: collectionName === 'Boissons' ? 'boissons' : 'ingredients'
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      alert('Erreur lors de la mise à jour du stock');
    }
  };

  const initializeStock = async () => {
    if (!window.confirm('Initialiser le stock à 10 pour toutes les boissons ?')) return;
    try {
      const collections = ['Boissons'];
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        for (const docSnapshot of snapshot.docs) {
          await updateDoc(doc(db, collectionName, docSnapshot.id), {
            stock: 10
          });
        }
      }
      alert('Stock initialisé avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      alert('Erreur lors de l\'initialisation du stock');
    }
  };

  // Nouvelles fonctions de gestion de stock
  const setStockValue = async (collectionName: "Plats" | "Boissons", id: string, value: string) => {
    const newStock = parseInt(value) || 0;
    try {
      await updateStock(collectionName, id, newStock);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
    }
  };

  const bulkUpdateStock = async (stockUpdates: { collection: string; id: string; stock: number }[]) => {
    try {
      for (const update of stockUpdates) {
        await updateDoc(doc(db, update.collection, update.id), {
          stock: Math.max(0, update.stock)
        });
      }
      alert('Stock mis à jour en masse avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour en masse:', error);
      alert('Erreur lors de la mise à jour en masse');
    }
  };

  const resetLowStock = async () => {
    if (!window.confirm('Remettre à 10 toutes les boissons avec stock faible (≤5) ?')) return;
    try {
      const collections = ['Boissons'];
      let updated = 0;
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          if ((data.stock || 0) <= 5) {
            await updateDoc(doc(db, collectionName, docSnapshot.id), {
              stock: 10
            });
            updated++;
          }
        }
      }
      alert(`${updated} boissons avec stock faible ont été remises à 10 !`);
    } catch (error) {
      console.error('Erreur lors de la remise à niveau:', error);
      alert('Erreur lors de la remise à niveau du stock');
    }
  };

  const exportStockReport = () => {
    const lowIngredients = ingredients.filter(ing => ing.quantite <= ing.seuilAlerte);
    
    const pdfContent = `
      <html>
        <head>
          <title>Rapport de Stock - Eat Neo</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2e7d32; padding-bottom: 20px; }
            .header h1 { color: #2e7d32; margin: 0; font-size: 28px; }
            .header p { margin: 5px 0; color: #666; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
            .stat-card { text-align: center; padding: 20px; border: 2px solid #ddd; border-radius: 8px; }
            .stat-card h3 { margin: 0 0 10px 0; color: #2e7d32; }
            .stat-card .number { font-size: 24px; font-weight: bold; margin: 0; }
            .stat-card .number.green { color: #4caf50; }
            .stat-card .number.orange { color: #ff9800; }
            .stat-card .number.red { color: #f44336; }
            .stat-card .number.blue { color: #2196f3; }
            .section { margin: 30px 0; }
            .section h2 { color: #2e7d32; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2e7d32; color: white; font-weight: bold; }
            .status-ok { color: #4caf50; font-weight: bold; }
            .status-low { color: #ff9800; font-weight: bold; }
            .status-out { color: #f44336; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Eat Neo - Rapport de Stock</h1>
            <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
            <p>Système de gestion des stocks</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <h3>Total Boissons</h3>
              <p class="number blue">${boissons.length}</p>
            </div>
            <div class="stat-card">
              <h3>Stock Faible</h3>
              <p class="number orange">${boissons.filter(item => (item.stock || 0) <= 5 && (item.stock || 0) > 0).length}</p>
            </div>
            <div class="stat-card">
              <h3>Rupture</h3>
              <p class="number red">${boissons.filter(item => (item.stock || 0) === 0).length}</p>
            </div>
            <div class="stat-card">
              <h3>Stock OK</h3>
              <p class="number green">${boissons.filter(item => (item.stock || 0) > 5).length}</p>
            </div>
          </div>
          
          <div class="section">
            <h2>État des Boissons</h2>
            <table>
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Stock Actuel</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${boissons.map(item => {
                  const stock = item.stock || 0;
                  const status = stock === 0 ? 'Rupture' : stock <= 5 ? 'Stock Faible' : 'OK';
                  const statusClass = stock === 0 ? 'status-out' : stock <= 5 ? 'status-low' : 'status-ok';
                  return `
                    <tr>
                      <td>${item.nom}</td>
                      <td>${stock} unités</td>
                      <td class="${statusClass}">${status}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2>État des Ingrédients</h2>
            <table>
              <thead>
                <tr>
                  <th>Ingrédient</th>
                  <th>Quantité</th>
                  <th>Seuil d'Alerte</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${ingredients.map(ing => {
                  const isLow = ing.quantite <= ing.seuilAlerte;
                  const status = isLow ? 'Stock Faible' : 'OK';
                  const statusClass = isLow ? 'status-low' : 'status-ok';
                  return `
                    <tr>
                      <td>${ing.nom}</td>
                      <td>${ing.quantite} ${ing.unite}</td>
                      <td>${ing.seuilAlerte} ${ing.unite}</td>
                      <td class="${statusClass}">${status}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Eat Neo - Système de gestion des stocks</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Initialiser les ingrédients de base
  const initializeBaseIngredients = async () => {
    const baseIngredients = [
      { nom: 'Riz', quantite: 10, unite: 'kg', seuilAlerte: 2 },
      { nom: 'Poulet', quantite: 5, unite: 'kg', seuilAlerte: 1 },
      { nom: 'Poisson', quantite: 3, unite: 'kg', seuilAlerte: 1 },
      { nom: 'Oignons', quantite: 2, unite: 'kg', seuilAlerte: 1 },
      { nom: 'Tomates', quantite: 3, unite: 'kg', seuilAlerte: 1 },
      { nom: 'Pommes de terre', quantite: 5, unite: 'kg', seuilAlerte: 2 },
      { nom: 'Plantains', quantite: 20, unite: 'pièces', seuilAlerte: 5 },
      { nom: 'Viande', quantite: 4, unite: 'kg', seuilAlerte: 1 },
      { nom: 'Arachides', quantite: 2, unite: 'kg', seuilAlerte: 1 },
      { nom: 'Spaghetti', quantite: 3, unite: 'kg', seuilAlerte: 1 },
      { nom: 'Sel', quantite: 1, unite: 'kg', seuilAlerte: 0.5 }
    ];
    
    try {
      for (const ingredient of baseIngredients) {
        await addDoc(collection(db, 'ingredients'), ingredient);
      }
      alert('Ingrédients de base ajoutés avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout des ingrédients');
    }
  };

  // Gestion des boissons
  const addBoisson = async () => {
    if (!newBoisson.nom.trim()) return alert('Nom requis');
    if (!newBoisson.prix.trim()) return alert('Prix requis');
    
    try {
      await addDoc(collection(db, 'Boissons'), {
        nom: newBoisson.nom,
        prix: newBoisson.prix,
        stock: newBoisson.stock,
        masque: false,
        catégorie: ['Boissons'],
        filtre: ['Boissons']
      });
      
      setNewBoisson({ nom: '', prix: '', stock: 10 });
      setShowAddBoisson(false);
      alert('Boisson ajoutée avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout');
    }
  };

  // Gestion des ingrédients
  const addIngredient = async () => {
    if (!newIngredient.nom.trim()) return alert('Nom requis');
    
    try {
      await addDoc(collection(db, 'ingredients'), {
        nom: newIngredient.nom,
        quantite: newIngredient.quantite,
        unite: newIngredient.unite,
        seuilAlerte: newIngredient.seuilAlerte
      });
      
      setNewIngredient({ nom: '', quantite: 0, unite: 'kg', seuilAlerte: 5 });
      setShowAddIngredient(false);
      alert('Ingrédient ajouté avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout');
    }
  };

  const updateIngredientStock = async (id: string, newQuantite: number) => {
    try {
      // Récupérer l'ancienne quantité
      const ingredientDoc = await getDoc(doc(db, 'ingredients', id));
      if (ingredientDoc.exists()) {
        const ingredientData = ingredientDoc.data();
        const oldQuantite = ingredientData.quantite || 0;
        const finalQuantite = Math.max(0, newQuantite);
        
        // Mettre à jour la quantité
        await updateDoc(doc(db, 'ingredients', id), {
          quantite: finalQuantite
        });
        
        // Enregistrer le mouvement si il y a un changement
        if (oldQuantite !== finalQuantite) {
          const difference = finalQuantite - oldQuantite;
          await logMouvementStock({
            item: ingredientData.nom,
            type: difference > 0 ? 'entree' : 'sortie',
            quantite: Math.abs(difference),
            unite: ingredientData.unite,
            stockAvant: oldQuantite,
            stockApres: finalQuantite,
            description: `Ajustement manuel du stock`,
            categorie: 'ingredients'
          });
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!window.confirm('Supprimer cet ingrédient ?')) return;
    
    try {
      await deleteDoc(doc(db, 'ingredients', id));
      alert('Ingrédient supprimé !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Fonction pour ajouter des données de test
  const addTestData = async () => {
    if (!window.confirm('Ajouter des données fictives de test ? Cela créera des commandes, ingrédients et mouvements de stock.')) return;
    
    try {
      // Commandes fictives
      const commandes = [
        {
          clientNom: "Dupont", clientPrenom: "Jean", localisation: "Table 5",
          items: [{ nom: "Ndolé", quantité: 2, prix: "2500 FCFA" }],
          total: 5000, statut: "livree", dateCommande: Timestamp.now()
        },
        {
          clientNom: "Mballa", clientPrenom: "Marie", localisation: "Table 12",
          items: [{ nom: "Poulet DG", quantité: 1, prix: "3000 FCFA" }],
          total: 3000, statut: "en_preparation", dateCommande: Timestamp.now()
        },
        {
          clientNom: "Nkomo", clientPrenom: "Paul", localisation: "Table 3",
          items: [{ nom: "Koki", quantité: 1, prix: "1500 FCFA" }],
          total: 1500, statut: "prete", dateCommande: Timestamp.now()
        },
        {
          clientNom: "Fotso", clientPrenom: "Claire", localisation: "Table 8",
          items: [{ nom: "Eru", quantité: 1, prix: "2000 FCFA" }],
          total: 2000, statut: "en_attente", dateCommande: Timestamp.now()
        }
      ];
      
      // Ingrédients fictifs
      const ingredients = [
        { nom: "Riz", quantite: 15, unite: "kg", seuilAlerte: 5 },
        { nom: "Poulet", quantite: 3, unite: "kg", seuilAlerte: 5 },
        { nom: "Tomates", quantite: 12, unite: "kg", seuilAlerte: 4 }
      ];
      
      // Mouvements fictifs
      const mouvements = [
        {
          item: "Coca-Cola", type: "sortie", quantite: 5, unite: "unités",
          stockAvant: 15, stockApres: 10, description: "Vente client",
          categorie: "boissons", date: Timestamp.now()
        }
      ];
      
      // Ajouter les données
      for (const cmd of commandes) {
        await addDoc(collection(db, 'commandes'), cmd);
      }
      for (const ing of ingredients) {
        await addDoc(collection(db, 'ingredients'), ing);
      }
      for (const mouv of mouvements) {
        await addDoc(collection(db, 'mouvements_stock'), mouv);
      }
      
      showToast('Données de test ajoutées avec succès !', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de l\'ajout des données', 'error');
    }
  };

  // Récupération des mouvements de stock
  useEffect(() => {
    const q = query(collection(db, 'mouvements_stock'), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mouvementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MouvementStock[];
      
      setMouvements(mouvementsData);
    });

    return () => unsubscribe();
  }, []);

  // Enregistrer un mouvement de stock
  const logMouvementStock = async (mouvement: Omit<MouvementStock, 'id' | 'date'>) => {
    try {
      await addDoc(collection(db, 'mouvements_stock'), {
        ...mouvement,
        date: Timestamp.now()
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du mouvement:', error);
    }
  };

  // Filtrer les mouvements selon la période et le type
  const filteredMouvements = mouvements.filter(mouvement => {
    const now = new Date();
    const mouvementDate = mouvement.date.toDate();
    
    // Filtre par période
    let periodMatch = true;
    switch (periodFilter) {
      case 'today':
        periodMatch = mouvementDate.toDateString() === now.toDateString();
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodMatch = mouvementDate >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        periodMatch = mouvementDate >= monthAgo;
        break;
      default:
        periodMatch = true;
    }
    
    // Filtre par type
    const typeMatch = typeFilter === 'all' || mouvement.categorie === typeFilter;
    
    return periodMatch && typeMatch;
  });

  // Fonctions d'export et d'impression
  const printMouvements = () => {
    const printContent = `
      <html>
        <head>
          <title>Rapport Mouvements de Stock - Eat Neo</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-card { text-align: center; padding: 10px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .entree { color: green; }
            .sortie { color: red; }
            .ajustement { color: orange; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Eat Neo - Rapport Mouvements de Stock</h1>
            <p>Période: ${periodFilter} | Type: ${typeFilter}</p>
            <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <h3>Total</h3>
              <p>${filteredMouvements.length}</p>
            </div>
            <div class="stat-card">
              <h3>Entrées</h3>
              <p>${filteredMouvements.filter(m => m.type === 'entree').length}</p>
            </div>
            <div class="stat-card">
              <h3>Sorties</h3>
              <p>${filteredMouvements.filter(m => m.type === 'sortie').length}</p>
            </div>
            <div class="stat-card">
              <h3>Ajustements</h3>
              <p>${filteredMouvements.filter(m => m.type === 'ajustement').length}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Article</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Stock Après</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${filteredMouvements.map(m => `
                <tr>
                  <td>${formatDate(m.date)}</td>
                  <td>${m.item}</td>
                  <td class="${m.type}">${m.type}</td>
                  <td>${m.type === 'entree' ? '+' : m.type === 'sortie' ? '-' : ''}${m.quantite} ${m.unite}</td>
                  <td>${m.stockApres} ${m.unite}</td>
                  <td>${m.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToExcel = () => {
    const csvContent = [
      ['Date', 'Article', 'Type', 'Quantité', 'Unité', 'Stock Après', 'Description'],
      ...filteredMouvements.map(m => [
        formatDate(m.date),
        m.item,
        m.type,
        m.quantite,
        m.unite,
        m.stockApres,
        m.description
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mouvements-stock-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportToWord = () => {
    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head>
          <meta charset='utf-8'>
          <title>Rapport Mouvements de Stock</title>
        </head>
        <body>
          <h1 style="text-align: center;">Eat Neo - Rapport Mouvements de Stock</h1>
          <p style="text-align: center;">Période: ${periodFilter} | Type: ${typeFilter}</p>
          <p style="text-align: center;">Généré le: ${new Date().toLocaleString('fr-FR')}</p>
          
          <h2>Statistiques</h2>
          <p>Total mouvements: ${filteredMouvements.length}</p>
          <p>Entrées: ${filteredMouvements.filter(m => m.type === 'entree').length}</p>
          <p>Sorties: ${filteredMouvements.filter(m => m.type === 'sortie').length}</p>
          <p>Ajustements: ${filteredMouvements.filter(m => m.type === 'ajustement').length}</p>
          
          <h2>Détail des mouvements</h2>
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #f2f2f2;">
              <th>Date</th>
              <th>Article</th>
              <th>Type</th>
              <th>Quantité</th>
              <th>Stock Après</th>
              <th>Description</th>
            </tr>
            ${filteredMouvements.map(m => `
              <tr>
                <td>${formatDate(m.date)}</td>
                <td>${m.item}</td>
                <td>${m.type}</td>
                <td>${m.type === 'entree' ? '+' : m.type === 'sortie' ? '-' : ''}${m.quantite} ${m.unite}</td>
                <td>${m.stockApres} ${m.unite}</td>
                <td>${m.description}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
    
    const blob = new Blob([wordContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mouvements-stock-${new Date().toISOString().split('T')[0]}.doc`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <LoadingSpinner text="Initialisation du back-office..." size={50} />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>Back Office - Administration</h1>
      
      {/* Onglets */}
      <AdminTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        commandesCount={commandes.filter(c => c.statut !== 'livree').length}
      />

      {/* Contenu de l'onglet Menu */}
      {activeTab === 'menu' && (
        <>
          {/* Formulaire ajout item */}
          <MenuForm
            nom={nom}
            setNom={setNom}
            description={description}
            setDescription={setDescription}
            prix={prix}
            setPrix={setPrix}
            categorie={categorie}
            setCategorie={setCategorie}
            filtre={filtre}
            setFiltre={setFiltre}
            imageUrl={imageUrl}
            uploading={uploading}
            error={error}
            editId={editId}
            onSubmit={handleSubmit}
            onFileSelect={handleFileSelect}
            onDrop={handleDrop}
          />

      {/* Barre de recherche */}
      <div className="search-section-container">
        <div className="search-wrapper">
          <input
            type="search"
            placeholder="Rechercher un item..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input-with-icon"
          />
          <div className="search-icon-absolute">
            <SearchIcon />
          </div>
        </div>
        <button
          onClick={migrateExistingItems}
          className="action-button blue"
        >
          Mettre à jour les items
        </button>
        <button
          onClick={resetAndReuploadItems}
          className="action-button red"
        >
          Reset & Re-upload
        </button>
      </div>

      {/* Debug info */}
      <div className="debug-container">
        <p><strong>Debug:</strong> Plats: {plats.length} items | Boissons: {boissons.length} items</p>
        {plats.length === 0 && <p className="debug-text-orange">Aucun plat trouvé dans Firestore</p>}
        {boissons.length === 0 && <p className="debug-text-orange">Aucune boisson trouvée dans Firestore</p>}
      </div>

      {/* Liste items (uniquement contenu stocké dans Firestore) */}
      <h2>Plats ({plats.length})</h2>
      <ul className="item-list">
        {plats.filter(item => 
          item.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.filtre?.[0]?.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(item => (
          <li key={item.id} className="item-card">
            {item.image && <img src={item.image} alt={item.nom} className="item-img" />}
            <div className="item-info">
              <b>{item.nom}</b> - {formatPrix(item)} <br />
              <i>Catégorie: {item.filtre?.[0]}</i>
            </div>
            <div className="item-actions-container">
              <button
                type="button"
                className="edit-button"
                onClick={() => {
                  setEditId(String(item.id));
                  setEditingCollection("Plats");
                  setNom(item.nom || "");
                  setDescription(item.description || "");
                  if (typeof item.prix === "string") setPrix([{ label: "", value: item.prix }]);
                  else setPrix(item.prix as PriceOption[]);
                  setCategorie(item.catégorie?.[0] || "plats");
                  setFiltre(item.filtre?.[0] || ""); // Charger le filtre
                  setImageUrl(item.image || "");
                }}
              >
                <EditIcon />
                Modifier
              </button>
              <button
                className={`visibility-button ${item.masque ? 'show' : 'hide'}`}
                onClick={() => toggleItemVisibility("Plats", String(item.id), item.masque || false)}
              >
                {item.masque ? <EyeIcon /> : <EyeOffIcon />}
                {item.masque ? 'Afficher' : 'Masquer'}
              </button>
              <button
                className="delete-button"
                onClick={() => handleDelete("Plats", String(item.id))}
              >
                <DeleteIcon />
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2>Boissons ({boissons.length})</h2>
      <ul className="item-list">
        {boissons.filter(item => 
          item.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.filtre?.[0]?.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(item => (
          <li key={item.id} className="item-card">
            {item.image && <img src={item.image} alt={item.nom} className="item-img" />}
            <div className="item-info">
              <b>{item.nom}</b> - {formatPrix(item)} <br />
              <i>Catégorie: {item.filtre?.[0]}</i>
            </div>
            <div className="item-actions-container">
              <button
                type="button"
                className="edit-button"
                onClick={() => {
                  setEditId(String(item.id));
                  setEditingCollection("Boissons");
                  setNom(item.nom || "");
                  setDescription(item.description || "");
                  if (typeof item.prix === "string") setPrix([{ label: "", value: item.prix }]);
                  else setPrix(item.prix as PriceOption[]);
                  setCategorie(item.catégorie?.[0] || "boissons");
                  setFiltre(item.filtre?.[0] || ""); // Charger le filtre
                  setImageUrl(item.image || "");
                }}
              >
                <EditIcon />
                Modifier
              </button>
              <button
                className={`visibility-button ${item.masque ? 'show' : 'hide'}`}
                onClick={() => toggleItemVisibility("Boissons", String(item.id), item.masque || false)}
              >
                {item.masque ? <EyeIcon /> : <EyeOffIcon />}
                {item.masque ? 'Afficher' : 'Masquer'}
              </button>
              <button
                className="delete-button"
                onClick={() => handleDelete("Boissons", String(item.id))}
              >
                <DeleteIcon />
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
        </>
      )}

      {/* Contenu de l'onglet Commandes */}
      {activeTab === 'commandes' && (
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
                        onChange={(e) => updateCommandeStatut(commande.id, e.target.value)}
                        // className="commande-status-select"
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
                      onClick={() => deleteCommande(commande.id)}
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
      )}

      {/* Contenu de l'onglet Stock */}
      {activeTab === 'stock' && (
        <div className="stock-section">
          <h2>Gestion du Stock</h2>
          
          <StockManagement
            stockView={stockView}
            setStockView={setStockView}
            stockSearchTerm={stockSearchTerm}
            setStockSearchTerm={setStockSearchTerm}
            onInitializeStock={initializeStock}
            onResetLowStock={resetLowStock}
            onAddBoisson={() => setShowAddBoisson(true)}
            onAddIngredient={() => setShowAddIngredient(true)}
            onInitializeBaseIngredients={initializeBaseIngredients}
            onExportStockReport={exportStockReport}
            boissonsCount={boissons.length}
            lowStockCount={boissons.filter(item => (item.stock || 0) <= 5 && (item.stock || 0) > 0).length}
            outOfStockCount={boissons.filter(item => (item.stock || 0) === 0).length}
            okStockCount={boissons.filter(item => (item.stock || 0) > 5).length}
            ingredientsCount={ingredients.length}
            lowIngredientsCount={ingredients.filter(ing => ing.quantite <= ing.seuilAlerte).length}
            okIngredientsCount={ingredients.filter(ing => ing.quantite > ing.seuilAlerte).length}
            totalUnits={ingredients.reduce((total, ing) => total + ing.quantite, 0)}
          />

          {/* Bouton pour ajouter des données de test */}
          <div className="test-data-section">
            <button
              onClick={addTestData}
              className="stock-action-button red"
            >
              Ajouter données de test
            </button>
          </div>

          {/* Gestion des Boissons */}
          {stockView === 'boissons' && (
            <>
              <h3 className="stock-section-title">Boissons ({boissons.length})</h3>
              
              {/* Formulaire d'ajout de boisson */}
              {showAddBoisson && (
                <div className="ingredient-form">
                  <h4>Ajouter une nouvelle boisson</h4>
                  <div className="ingredient-form-grid">
                    <input
                      type="text"
                      placeholder="Nom de la boisson"
                      value={newBoisson.nom}
                      onChange={(e) => setNewBoisson({...newBoisson, nom: e.target.value})}
                      className="ingredient-form-input"
                    />
                    <input
                      type="text"
                      placeholder="Prix (ex: 500 FCFA)"
                      value={newBoisson.prix}
                      onChange={(e) => setNewBoisson({...newBoisson, prix: e.target.value})}
                      className="ingredient-form-input"
                    />
                    <input
                      type="number"
                      placeholder="Stock initial"
                      value={newBoisson.stock}
                      onChange={(e) => setNewBoisson({...newBoisson, stock: Number(e.target.value)})}
                      className="ingredient-form-input"
                    />
                  </div>
                  <div className="ingredient-form-actions">
                    <button
                      onClick={addBoisson}
                      className="ingredient-btn-add"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => setShowAddBoisson(false)}
                      className="ingredient-btn-cancel"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
              
              <div className="stock-grid-container">
            {boissons.filter(item => 
              item.nom?.toLowerCase().includes(stockSearchTerm.toLowerCase())
            ).map(item => {
              const stockLevel = item.stock || 0;
              const isOutOfStock = stockLevel === 0;
              const isLowStock = stockLevel <= 5 && stockLevel > 0;
              
              return (
                <div key={item.id} className={`stock-card-complex ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'normal-stock'}`}>
                  {/* Badge de statut */}
                  <div className={`stock-badge-complex ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'normal-stock'}`}>
                    {isOutOfStock ? 'Rupture' : isLowStock ? 'Faible' : 'OK'}
                  </div>
                  
                  {/* Image et nom */}
                  <div className="stock-header-complex">
                    {item.image && (
                      <div className="stock-image-complex">
                        <img 
                          src={item.image} 
                          alt={item.nom} 
                        />
                      </div>
                    )}
                    <div className="stock-info-complex">
                      <h4 className="stock-title-complex">
                        {item.nom}
                      </h4>
                      <p className="stock-text-complex">
                        Stock actuel: <span className={`stock-level-complex ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'normal-stock'}`}>{stockLevel}</span> unités
                      </p>
                    </div>
                  </div>
                  
                  {/* Contrôles de stock */}
                  <div className="stock-controls-complex">
                    <button 
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newStock = Math.max(0, (item.stock || 0) - 1);
                        await updateStock("Boissons", String(item.id), newStock);
                      }}
                      className="stock-btn-minus-hover"
                      title="Diminuer le stock"
                    >
                      <MinusIcon />
                    </button>
                    
                    <input
                      type="number"
                      value={item.stock || 0}
                      onChange={async (e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        await setStockValue("Boissons", String(item.id), value);
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                          e.preventDefault();
                        }
                      }}
                      className="stock-input-complex"
                      min="0"
                      placeholder="0"
                    />
                    
                    <button 
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newStock = (item.stock || 0) + 1;
                        await updateStock("Boissons", String(item.id), newStock);
                      }}
                      className="stock-btn-plus-hover"
                      title="Augmenter le stock"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleDelete("Boissons", String(item.id))}
                    className="ingredient-btn-delete"
                  >
                    Supprimer
                  </button>
                </div>
              );
            })}
          </div>
            </>
          )}

          {/* Gestion des Ingrédients */}
      {stockView === 'ingredients' && (
        <>
          <h3 className="ingredients-section-title">Ingrédients ({ingredients.length})</h3>
          
          {/* Formulaire d'ajout d'ingrédient */}
          {showAddIngredient && (
            <div className="ingredient-form">
              <h4>Ajouter un nouvel ingrédient</h4>
              <div className="ingredient-form-grid">
                <input
                  type="text"
                  placeholder="Nom de l'ingrédient"
                  value={newIngredient.nom}
                  onChange={(e) => setNewIngredient({...newIngredient, nom: e.target.value})}
                  className="ingredient-form-input"
                />
                <input
                  type="number"
                  placeholder="Quantité"
                  value={newIngredient.quantite}
                  onChange={(e) => setNewIngredient({...newIngredient, quantite: Number(e.target.value)})}
                  className="ingredient-form-input"
                />
                <select
                  value={newIngredient.unite}
                  onChange={(e) => setNewIngredient({...newIngredient, unite: e.target.value})}
                  className="ingredient-form-input"
                >
                  <option value="kg">kg</option>
                  <option value="L">L</option>
                  <option value="pièces">pièces</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                </select>
                <input
                  type="number"
                  placeholder="Seuil d'alerte"
                  value={newIngredient.seuilAlerte}
                  onChange={(e) => setNewIngredient({...newIngredient, seuilAlerte: Number(e.target.value)})}
                  className="ingredient-form-input"
                />
              </div>
              <div className="ingredient-form-actions">
                <button
                  onClick={addIngredient}
                  className="ingredient-btn-add"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => setShowAddIngredient(false)}
                  className="ingredient-btn-cancel"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste des ingrédients */}
          <div className="ingredients-grid">
            {ingredients.filter(ingredient => 
              ingredient.nom?.toLowerCase().includes(stockSearchTerm.toLowerCase())
            ).map(ingredient => {
              const isLowStock = ingredient.quantite <= ingredient.seuilAlerte;
              
              return (
                <div key={ingredient.id} className={`ingredient-card ${isLowStock ? 'low-stock' : 'normal-stock'}`}>
                  {/* Badge de statut */}
                  <div className={`ingredient-status-badge ${isLowStock ? 'low-stock' : 'normal-stock'}`}>
                    {isLowStock ? 'Stock Faible' : 'OK'}
                  </div>
                  
                  <h4 className="ingredient-title">
                    {ingredient.nom}
                  </h4>
                  
                  <div className="ingredient-info">
                    <p>
                      Quantité: <span className={`ingredient-quantity ${isLowStock ? 'low-stock' : 'normal-stock'}`}>
                        {ingredient.quantite} {ingredient.unite}
                      </span>
                    </p>
                    <p>
                      Seuil d'alerte: {ingredient.seuilAlerte} {ingredient.unite}
                    </p>
                  </div>
                  
                  {/* Contrôles */}
                  <div className="ingredient-controls">
                    <button
                      onClick={() => updateIngredientStock(ingredient.id, ingredient.quantite - 1)}
                      className="ingredient-btn-minus"
                    >
                      <MinusIcon />
                    </button>
                    
                    <input
                      type="number"
                      value={ingredient.quantite}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        updateIngredientStock(ingredient.id, Number(value) || 0);
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                          e.preventDefault();
                        }
                      }}
                      className="ingredient-input"
                      min="0"
                      placeholder="0"
                    />
                    
                    <button
                      onClick={() => updateIngredientStock(ingredient.id, ingredient.quantite + 1)}
                      className="ingredient-btn-plus"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => deleteIngredient(ingredient.id)}
                    className="ingredient-btn-delete"
                  >
                    Supprimer
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  )}

      {/* Contenu de l'onglet Historique */}
      {activeTab === 'historique' && (
        <div className="historique-section">
          <h2>Historique & Rapports</h2>
          
          {/* Sous-onglets Historique */}
          <div className="historique-tabs-container">
            <button
              onClick={() => setHistoriqueView('commandes')}
              className={`historique-tab-button ${historiqueView === 'commandes' ? 'active' : 'inactive'}`}
            >
              Commandes Livrées
            </button>
            <button
              onClick={() => setHistoriqueView('mouvements')}
              className={`historique-tab-button ${historiqueView === 'mouvements' ? 'active' : 'inactive'}`}
            >
              Mouvements de Stock
            </button>
          </div>

          {/* Vue Commandes */}
          {historiqueView === 'commandes' && (
            <>
              {/* Statistiques de l'historique */}
              <div className="historique-stats-grid">
                <div className="historique-stat-card">
                  <h4 className="historique-stat-title">Total Livré</h4>
                  <p className="historique-stat-number green">
                    {historique.length}
                  </p>
                </div>
                <div className="historique-stat-card">
                  <h4 className="historique-stat-title">Chiffre d'Affaires</h4>
                  <p className="historique-stat-number orange small">
                    {historique.reduce((total, cmd) => total + cmd.total, 0).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div className="historique-stat-card">
                  <h4 className="historique-stat-title">Moyenne/Commande</h4>
                  <p className="historique-stat-number blue small">
                    {historique.length > 0 ? Math.round(historique.reduce((total, cmd) => total + cmd.total, 0) / historique.length).toLocaleString('fr-FR') : 0} FCFA
                  </p>
                </div>
              </div>

              {historique.length === 0 ? (
                <div className="historique-empty-container">
                  <HistoryIcon />
                  <h3 className="historique-empty-title">Aucune commande dans l'historique</h3>
                  <p className="historique-empty-text">Les commandes livrées apparaitront ici</p>
                </div>
              ) : (
                <div className="historique-list-container">
                  {historique.map((commande) => (
                    <div key={commande.id} className="historique-card">
                      <div className="historique-card-header">
                        <div className="historique-client-info">
                          <h3>
                            {commande.clientPrenom} {commande.clientNom}
                          </h3>
                          <p>
                            {formatDate(commande.dateCommande)} • {commande.localisation}
                          </p>
                        </div>
                        <div className="historique-card-actions">
                          <span className="historique-status-badge">
                            Livrée
                          </span>
                          <p className="historique-total-price">
                            {formatPrixCommande(commande.total)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="historique-items-container">
                        <h4 className="historique-items-title">Articles commandés:</h4>
                        <div className="historique-items-grid">
                          {commande.items.map((item, index) => (
                            <div key={index} className="historique-item">
                              <strong>{item.nom}</strong> × {item.quantité} ({item.prix})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Vue Mouvements de Stock */}
          {historiqueView === 'mouvements' && (
            <MouvementsStock
              periodFilter={periodFilter}
              setPeriodFilter={setPeriodFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              filteredMouvements={filteredMouvements}
              onPrintMouvements={printMouvements}
              onExportToExcel={exportToExcel}
              onExportToWord={exportToWord}
              formatDate={formatDate}
            />
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
        />
      )}
    </div>
  );
}
