'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
import ProfitAnalysis from './ProfitAnalysis';
import { LoadingSpinner, SearchIcon, EditIcon, DeleteIcon, EyeIcon, EyeOffIcon, PlusIcon, MinusIcon, HistoryIcon } from './Icons';
import '@/styles/AdminPage.css'
import { menuItems, drinksItems } from "./types";
import { findSimilarCategory, formatPrice } from './utils';



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
  categorie: 'boissons' | 'plats';
}
// Convertir une URL Firebase Storage → chemin interne utilisable par ref()
function getStoragePathFromUrl(url: string) {
  const match = url.match(/o\/(.*?)\?alt=media/);
  return match ? decodeURIComponent(match[1]) : "";
}

interface AdminPageProps {
  userRole: 'admin' | 'employee'
}

export default function AdminPage({ userRole }: AdminPageProps) {
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
  const [activeTab, setActiveTab] = useState<'menu' | 'commandes' | 'stock' | 'historique' | 'rentabilite'>('menu');
  const [stockView, setStockView] = useState<'boissons' | 'plats'>('boissons');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');
  const [historiqueView, setHistoriqueView] = useState<'commandes' | 'mouvements'>('commandes');
  const [periodFilter, setPeriodFilter] = useState('month');
  const [typeFilter, setTypeFilter] = useState('all');
  const [mouvements, setMouvements] = useState<any[]>([]);
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [commandesPeriodFilter, setCommandesPeriodFilter] = useState('month');
  const [pendingStockChange, setPendingStockChange] = useState<{itemId: string, newStock: number, collection: string} | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  // Système de notifications
  const { toasts, modal, showToast, removeToast, showModal, closeModal } = useNotifications();
  const { logActivity, logNotification } = useActivityLogger();
  

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

  // Optimisation: Mémoriser les listes filtrées
  const filteredPlats = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return plats.filter(item => 
      item.nom?.toLowerCase().includes(searchLower) ||
      item.filtre?.[0]?.toLowerCase().includes(searchLower)
    );
  }, [plats, searchTerm]);
  
  const filteredBoissons = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return boissons.filter(item => 
      item.nom?.toLowerCase().includes(searchLower) ||
      item.filtre?.[0]?.toLowerCase().includes(searchLower)
    );
  }, [boissons, searchTerm]);
  
  // Optimisation: Mémoriser les listes filtrées pour le stock
  const filteredStockBoissons = useMemo(() => {
    const searchLower = stockSearchTerm.toLowerCase();
    return boissons.filter(item => {
      const matchesSearch = item.nom?.toLowerCase().includes(searchLower);
      const stockLevel = item.stock || 0;
      
      let matchesFilter = true;
      switch (stockFilter) {
        case 'low': matchesFilter = stockLevel <= 5 && stockLevel > 0; break;
        case 'out': matchesFilter = stockLevel === 0; break;
        case 'ok': matchesFilter = stockLevel > 5; break;
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [boissons, stockSearchTerm, stockFilter]);
  
  const filteredStockPlats = useMemo(() => {
    const searchLower = stockSearchTerm.toLowerCase();
    return plats.filter(item => {
      const matchesSearch = item.nom?.toLowerCase().includes(searchLower);
      const stockLevel = item.stock || 0;
      
      let matchesFilter = true;
      switch (stockFilter) {
        case 'low': matchesFilter = stockLevel <= 5 && stockLevel > 0; break;
        case 'out': matchesFilter = stockLevel === 0; break;
        case 'ok': matchesFilter = stockLevel > 5; break;
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [plats, stockSearchTerm, stockFilter]);

  // Optimisation: Calculer les statistiques de stock une seule fois
  const stockStats = useMemo(() => {
    const calculateStats = (items: MenuItem[]) => {
      let low = 0, out = 0, ok = 0;
      for (const item of items) {
        const stock = item.stock || 0;
        if (stock === 0) out++;
        else if (stock <= 5) low++;
        else ok++;
      }
      return { low, out, ok };
    };
    
    return {
      boissons: calculateStats(boissons),
      plats: calculateStats(plats)
    };
  }, [boissons, plats]);

  // Fonction pour restaurer depuis une sauvegarde
  const restoreFromBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      if (!backupData.plats || !backupData.boissons) {
        showToast('Fichier de sauvegarde invalide', 'error');
        return;
      }
      
      showModal(
        "Restaurer la sauvegarde",
        `Restaurer ${backupData.totalItems} items depuis la sauvegarde du ${new Date(backupData.timestamp).toLocaleString('fr-FR')} ? Cela remplacera toutes les données actuelles.`,
        "warning",
        async () => {
          try {
            // Supprimer toutes les données actuelles
            const collections = ['Plats', 'Boissons'];
            for (const collectionName of collections) {
              const snapshot = await getDocs(collection(db, collectionName));
              for (const docSnapshot of snapshot.docs) {
                await deleteDoc(doc(db, collectionName, docSnapshot.id));
              }
            }
            
            // Restaurer les plats
            for (const plat of backupData.plats) {
              const { id, ...platData } = plat; // Exclure l'ancien ID
              await addDoc(collection(db, 'Plats'), platData);
            }
            
            // Restaurer les boissons
            for (const boisson of backupData.boissons) {
              const { id, ...boissonData } = boisson; // Exclure l'ancien ID
              await addDoc(collection(db, 'Boissons'), boissonData);
            }
            
            showToast(`${backupData.totalItems} items restaurés avec succès !`, 'success');
            closeModal();
          } catch (error) {
            console.error('Erreur lors de la restauration:', error);
            showToast('Erreur lors de la restauration', 'error');
            closeModal();
          }
        },
        closeModal
      );
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      showToast('Erreur lors de la lecture du fichier de sauvegarde', 'error');
    }
    
    // Reset l'input file
    event.target.value = '';
  };

  // Fonction pour sauvegarder les données actuelles
  const backupCurrentData = async () => {
    try {
      const allItems = [...plats, ...boissons];
      const backupData = {
        timestamp: new Date().toISOString(),
        plats: plats,
        boissons: boissons,
        totalItems: allItems.length
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-eatneo-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      showToast('Sauvegarde créée avec succès !', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  // Fonction pour supprimer et re-uploader tous les items avec le champ masque
  const resetAndReuploadItems = async () => {
    if (isResetting) {
      showToast('Opération de reset déjà en cours, veuillez patienter...', 'warning');
      return;
    }

    showModal(
      "Confirmer le reset",
      "⚠️ ATTENTION: Cette action supprimera TOUTES les données actuelles et les remplacera par les données par défaut. Voulez-vous d'abord créer une sauvegarde ?",
      "warning",
      async () => {
        setIsResetting(true);
        try {
          // Créer automatiquement une sauvegarde avant le reset
          await backupCurrentData();
          
          // Attendre 1 seconde pour que la sauvegarde se termine
          setTimeout(async () => {
            try {
              // Supprimer toutes les collections
              const collections = ['Plats', 'Boissons'];
              
              for (const collectionName of collections) {
                const snapshot = await getDocs(collection(db, collectionName));
                for (const docSnapshot of snapshot.docs) {
                  await deleteDoc(doc(db, collectionName, docSnapshot.id));
                }
              }
              
              // Collecter toutes les catégories existantes pour normalisation
              const existingCategories: string[] = [];
              
              // Re-uploader les items avec normalisation et vérification des doublons
              const addedItems = new Set<string>(); // Prévenir les doublons
              
              for (const item of menuItems) {
                const itemKey = item.nom?.toLowerCase().trim();
                if (addedItems.has(itemKey)) {
                  console.log(`Doublon détecté et ignoré: ${item.nom}`);
                  continue;
                }
                const similarCategory = findSimilarCategory(item.filtre?.[0] || '', existingCategories);
                const finalCategory = similarCategory || item.filtre?.[0] || '';
                if (!existingCategories.includes(finalCategory)) {
                  existingCategories.push(finalCategory);
                }
                
                const formattedPrix = typeof item.prix === 'string' 
                  ? formatPrice(item.prix)
                  : Array.isArray(item.prix) 
                    ? item.prix.map(p => ({ ...p, value: formatPrice(p.value) }))
                    : item.prix;
                
                await addDoc(collection(db, 'Plats'), {
                  ...item,
                  prix: formattedPrix,
                  catégorie: [finalCategory],
                  filtre: [finalCategory],
                  masque: false
                });
                
                addedItems.add(itemKey);
              }
              
              for (const item of drinksItems) {
                const itemKey = item.nom?.toLowerCase().trim();
                if (addedItems.has(itemKey)) {
                  console.log(`Doublon détecté et ignoré: ${item.nom}`);
                  continue;
                }
                const similarCategory = findSimilarCategory(item.filtre?.[0] || '', existingCategories);
                const finalCategory = similarCategory || item.filtre?.[0] || '';
                if (!existingCategories.includes(finalCategory)) {
                  existingCategories.push(finalCategory);
                }
                
                const formattedPrix = typeof item.prix === 'string' 
                  ? formatPrice(item.prix)
                  : Array.isArray(item.prix) 
                    ? item.prix.map(p => ({ ...p, value: formatPrice(p.value) }))
                    : item.prix;
                
                await addDoc(collection(db, 'Boissons'), {
                  ...item,
                  prix: formattedPrix,
                  catégorie: [finalCategory],
                  filtre: [finalCategory],
                  masque: false
                });
                
                addedItems.add(itemKey);
              }
              
              showToast('Tous les items ont été re-uploadés avec normalisation !', 'success');
            } catch (error) {
              console.error('Erreur lors du reset:', error);
              showToast('Erreur lors du reset', 'error');
            } finally {
              setIsResetting(false);
            }
          }, 1000); // Attendre 1 seconde
        } catch (error) {
          console.error('Erreur lors de la sauvegarde:', error);
          showToast('Erreur lors de la sauvegarde', 'error');
          setIsResetting(false);
        }
        closeModal();
      },
      () => {
        closeModal();
        setIsResetting(false);
      }
    );
  };

  // Migration: ajouter les champs masque et stock aux items existants
  const migrateExistingItems = async () => {
    try {
      const collections = ['Plats', 'Boissons'];
      const existingCategories: string[] = [];
      
      // Première passe : collecter toutes les catégories
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          if (data.filtre?.[0] && !existingCategories.includes(data.filtre[0])) {
            existingCategories.push(data.filtre[0]);
          }
        }
      }
      
      // Deuxième passe : normaliser et mettre à jour
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          const updates: any = {};
          
          if (data.masque === undefined) {
            updates.masque = false;
          }
          
          if (data.stock === undefined) {
            updates.stock = 10;
          }
          
          // Normaliser la catégorie
          if (data.filtre?.[0]) {
            const similarCategory = findSimilarCategory(data.filtre[0], existingCategories);
            if (similarCategory && similarCategory !== data.filtre[0]) {
              updates.filtre = [similarCategory];
              updates.catégorie = [similarCategory];
            }
          }
          
          // Formater le prix
          if (data.prix) {
            const formattedPrix = typeof data.prix === 'string' 
              ? formatPrice(data.prix)
              : Array.isArray(data.prix) 
                ? data.prix.map((p: any) => ({ ...p, value: formatPrice(p.value) }))
                : data.prix;
            
            if (JSON.stringify(formattedPrix) !== JSON.stringify(data.prix)) {
              updates.prix = formattedPrix;
            }
          }
          
          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, collectionName, docSnapshot.id), updates);
          }
        }
      }
      
      console.log('Migration terminée: normalisation appliquée aux items existants');
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

    // Vérification des doublons (sauf en mode édition)
    if (!editId) {
      const existingItems = [...plats, ...boissons];
      const duplicateItem = existingItems.find(item => 
        item.nom?.toLowerCase().trim() === nom.toLowerCase().trim()
      );
      
      if (duplicateItem) {
        return alert(`Un plat/boisson avec le nom "${nom}" existe déjà. Veuillez choisir un autre nom.`);
      }
    }

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

      // Normalisation de la catégorie
      let finalFiltre = filtre;
      if (!editId) {
        const existingCategories = [...plats, ...boissons]
          .map(item => item.filtre?.[0])
          .filter(Boolean) as string[];
        
        const similarCategory = findSimilarCategory(filtre, existingCategories);
        if (similarCategory) {
          finalFiltre = similarCategory;
        }
      }

      // Formatage des prix
      const prixField: string | PriceOption[] = prix.length === 1 && prix[0].label === "" 
        ? formatPrice(prix[0].value)
        : prix.map(p => ({ ...p, value: formatPrice(p.value) }));

      if (editId) {
        await setDoc(
          doc(db, collectionName, editId),
          {
            nom,
            description,
            prix: prixField,
            catégorie: [finalFiltre],
            filtre: [finalFiltre],
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
          catégorie: [finalFiltre],
          filtre: [finalFiltre],
          image: imageUrl,
          masque: false, // Nouveau champ pour tous les nouveaux items
          stock: 10, // Stock initial par défaut
        });
      }

      // Enregistrer l'activité
      await logActivity({
        action: editId ? 'Modification' : 'Ajout',
        entity: collectionName.slice(0, -1).toLowerCase(),
        entityId: editId || 'nouveau',
        details: `${editId ? 'Modification' : 'Ajout'} de "${nom}" effectué par ${userRole}`,
        type: editId ? 'update' : 'create'
      });

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

  // Optimisation: Mémoriser le formatage des prix
  const formatPrix = useCallback((item: MenuItem) => {
    if (typeof item.prix === "string") return item.prix;
    return item.prix.map(p => `${p.label ? p.label + " - " : ""}${p.value}`).join(", ");
  }, []);

  // Fonction pour masquer/afficher un item
  const toggleItemVisibility = async (collectionName: "Plats" | "Boissons", id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, collectionName, id), {
        masque: !currentStatus
      });
      showToast(`Item ${!currentStatus ? 'masqué' : 'affiché'} avec succès !`, 'success');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  // Optimisation: Créer un index des items pour éviter les recherches O(n)
  const itemsIndex = useMemo(() => {
    const index = new Map<string, {id: string, collection: 'Plats' | 'Boissons', stock: number}>();
    plats.forEach(item => index.set(item.nom, {id: String(item.id), collection: 'Plats', stock: item.stock || 0}));
    boissons.forEach(item => index.set(item.nom, {id: String(item.id), collection: 'Boissons', stock: item.stock || 0}));
    return index;
  }, [plats, boissons]);

  // Gestion des commandes avec déduction automatique du stock (optimisé)
  const updateCommandeStatut = async (commandeId: string, nouveauStatut: string) => {
    try {
      const commandeDoc = await getDoc(doc(db, 'commandes', commandeId));
      if (!commandeDoc.exists()) {
        showToast('Commande introuvable', 'error');
        return;
      }
      
      const commandeData = commandeDoc.data() as Commande;
      
      // Si le nouveau statut est "livree", déduire le stock
      if (nouveauStatut === 'livree' && commandeData.statut !== 'livree') {
        const stockUpdates: Promise<void>[] = [];
        
        for (const item of commandeData.items) {
          const itemInfo = itemsIndex.get(item.nom);
          if (itemInfo) {
            const newStock = Math.max(0, itemInfo.stock - item.quantité);
            
            // Batch les mises à jour pour améliorer les performances
            stockUpdates.push(
              updateDoc(doc(db, itemInfo.collection, itemInfo.id), { stock: newStock })
                .then(() => logMouvementStock({
                  item: item.nom,
                  type: 'sortie',
                  quantite: item.quantité,
                  unite: 'unités',
                  stockAvant: itemInfo.stock,
                  stockApres: newStock,
                  description: `Livraison commande #${commandeId.slice(-6)}`,
                  categorie: itemInfo.collection === 'Plats' ? 'plats' : 'boissons'
                }))
            );
          }
        }
        
        // Exécuter toutes les mises à jour en parallèle
        await Promise.all(stockUpdates);
      }
      
      await updateDoc(doc(db, 'commandes', commandeId), { statut: nouveauStatut });
      
      showToast(
        nouveauStatut === 'livree' 
          ? 'Commande livrée et stock mis à jour !' 
          : 'Statut mis à jour avec succès !', 
        'success'
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showToast('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const deleteCommande = async (commandeId: string) => {
    showModal(
      "Supprimer la commande",
      "Êtes-vous sûr de vouloir supprimer cette commande ?",
      "warning",
      async () => {
        try {
          await deleteDoc(doc(db, 'commandes', commandeId));
          showToast('Commande supprimée avec succès !', 'success');
          closeModal();
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          showToast('Erreur lors de la suppression', 'error');
          closeModal();
        }
      },
      closeModal
    );
  };

  // Optimisation: Mémoriser les fonctions de formatage
  const formatDate = useCallback((timestamp: Timestamp): string => {
    return timestamp.toDate().toLocaleString('fr-FR');
  }, []);

  const formatPrixCommande = useCallback((valeur: number): string => {
    return valeur.toLocaleString('fr-FR') + ' FCFA';
  }, []);

  const getStatutColor = (statut: string): string => {
    switch (statut) {
      case 'en_attente': return '#ff9800';
      case 'en_preparation': return '#2196f3';
      case 'prete': return '#4caf50';
      case 'livree': return '#9e9e9e';
      default: return '#757575';
    }
  };

  // Gestion du stock avec enregistrement des mouvements (pour augmentation directe)
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
            description: `Ajustement manuel du stock par ${userRole}`,
            categorie: collectionName === 'Boissons' ? 'boissons' : 'plats'
          });
          
          // Enregistrer la notification pour augmentation
          if (difference > 0) {
            await logNotification(
              'stock_low',
              `Stock augmenté pour ${itemData.nom}`,
              `Le stock de "${itemData.nom}" est passé de ${oldStock} à ${finalStock} unités`
            );
            
            await logActivity({
              action: 'Augmentation stock',
              entity: collectionName.toLowerCase(),
              entityId: id,
              details: `Stock de "${itemData.nom}" augmenté: ${oldStock} → ${finalStock} unités par ${userRole}`,
              type: 'update'
            });
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      showToast('Erreur lors de la mise à jour du stock', 'error');
    }
  };

  // Fonction pour confirmer le changement de stock
  const confirmStockChange = async () => {
    if (pendingStockChange) {
      try {
        // Récupérer les détails de l'item avant mise à jour
        const itemDoc = await getDoc(doc(db, pendingStockChange.collection, pendingStockChange.itemId));
        if (itemDoc.exists()) {
          const itemData = itemDoc.data();
          const oldStock = itemData.stock || 0;
          const newStock = pendingStockChange.newStock;
          
          // Mettre à jour le stock
          await updateDoc(doc(db, pendingStockChange.collection, pendingStockChange.itemId), {
            stock: newStock
          });
          
          // Enregistrer le mouvement de stock
          const difference = newStock - oldStock;
          await logMouvementStock({
            item: itemData.nom,
            type: difference > 0 ? 'entree' : 'sortie',
            quantite: Math.abs(difference),
            unite: 'unités',
            stockAvant: oldStock,
            stockApres: newStock,
            description: `Ajustement manuel du stock par ${userRole}`,
            categorie: pendingStockChange.collection === 'Boissons' ? 'boissons' : 'plats'
          });
          
          // Enregistrer la notification
          await logNotification(
            difference > 0 ? 'stock_low' : 'stock_out',
            `Stock ${difference > 0 ? 'augmenté' : 'diminué'} pour ${itemData.nom}`,
            `Le stock de "${itemData.nom}" est passé de ${oldStock} à ${newStock} unités`
          );
          
          // Enregistrer l'activité
          await logActivity({
            action: 'Modification stock',
            entity: pendingStockChange.collection.toLowerCase(),
            entityId: pendingStockChange.itemId,
            details: `Stock de "${itemData.nom}" modifié: ${oldStock} → ${newStock} unités par ${userRole}`,
            type: 'update'
          });
        }
        
        setPendingStockChange(null);
        showToast('Stock mis à jour avec succès !', 'success');
      } catch (error) {
        console.error('Erreur lors de la confirmation:', error);
        showToast('Erreur lors de la mise à jour du stock', 'error');
      }
    }
  };

  const cancelStockChange = () => {
    setPendingStockChange(null);
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
            <p>NIU: P067500122904X | Email: eatneo@gmail.com | Tél: 696 032 113</p>
            <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
            <p>Système de gestion des stocks</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <h3>Total Articles</h3>
              <p class="number blue">${boissons.length + plats.length}</p>
            </div>
            <div class="stat-card">
              <h3>Stock Faible</h3>
              <p class="number orange">${boissons.filter(item => (item.stock || 0) <= 5 && (item.stock || 0) > 0).length + plats.filter(item => (item.stock || 0) <= 5 && (item.stock || 0) > 0).length}</p>
            </div>
            <div class="stat-card">
              <h3>Rupture</h3>
              <p class="number red">${boissons.filter(item => (item.stock || 0) === 0).length + plats.filter(item => (item.stock || 0) === 0).length}</p>
            </div>
            <div class="stat-card">
              <h3>Stock OK</h3>
              <p class="number green">${boissons.filter(item => (item.stock || 0) > 5).length + plats.filter(item => (item.stock || 0) > 5).length}</p>
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
            <h2>État des Plats</h2>
            <table>
              <thead>
                <tr>
                  <th>Plat</th>
                  <th>Stock Actuel</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${plats.map(item => {
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
      
      // Enregistrer l'activité
      await logActivity({
        action: 'Ajout',
        entity: 'boisson',
        entityId: 'nouveau',
        details: `Ajout de "${newBoisson.nom}" avec stock initial de ${newBoisson.stock} unités par ${userRole}`,
        type: 'create'
      });
      
      setNewBoisson({ nom: '', prix: '', stock: 10 });
      setShowAddBoisson(false);
      alert('Boisson ajoutée avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout');
    }
  };



  // Fonction pour ajouter les nouveaux plats
  const addNewMenuItems = async () => {
    if (!window.confirm('Ajouter tous les nouveaux plats au menu ? Cette action ajoutera 23 nouveaux plats.')) return;
    
    try {
      const newPlats = [
        // Petit Déjeuner
        { nom: "Spaghetti sauté simple", description: "Spaghetti sautés aux légumes frais", prix: "1000 FCFA", catégorie: ["Petit Déjeuner"], filtre: ["Petit Déjeuner"], image: "/spagetti-saute-simple.jpeg", masque: false, stock: 10 },
        { nom: "Spaghetti sauté viande", description: "Spaghetti sautés avec morceaux de viande", prix: "1500 FCFA", catégorie: ["Petit Déjeuner"], filtre: ["Petit Déjeuner"], image: "/spagetti-saute-viande.jpeg", masque: false, stock: 10 },
        { nom: "Crudité", description: "Assortiment de légumes frais et croquants", prix: "1000 FCFA", catégorie: ["Petit Déjeuner"], filtre: ["Petit Déjeuner"], image: "/crudité.jpeg", masque: false, stock: 10 },
        { nom: "Salade d'avocat", description: "Salade fraîche à base d'avocat mûr", prix: "1000 FCFA", catégorie: ["Petit Déjeuner"], filtre: ["Petit Déjeuner"], image: "/salade-avocat-en-accompagnement-640x427.webp", masque: false, stock: 10 },
        { nom: "Haricot viande", description: "Haricots mijotés avec morceaux de viande", prix: "1000 FCFA", catégorie: ["Petit Déjeuner"], filtre: ["Petit Déjeuner"], image: "/haricot-viande.jpeg", masque: false, stock: 10 },
        
        // Grillades
        { nom: "Poulet grillé", description: "Poulet grillé aux épices locales", prix: "3000 FCFA", catégorie: ["Grillades"], filtre: ["Grillades"], image: "/poulet_braisé.jpeg", masque: false, stock: 10 },
        { nom: "Porc grillé", description: "Porc grillé tendre et savoureux", prix: "3500 FCFA", catégorie: ["Grillades"], filtre: ["Grillades"], image: "/porc-grille.jpeg", masque: false, stock: 10 },
        { nom: "Saucisse", description: "Saucisses grillées artisanales", prix: "3500 FCFA", catégorie: ["Grillades"], filtre: ["Grillades"], image: "/saucisse.jpg", masque: false, stock: 10 },
        { nom: "Boulettes", description: "Boulettes de viande grillées", prix: "2500 FCFA", catégorie: ["Grillades"], filtre: ["Grillades"], image: "/boulettes.jpeg", masque: false, stock: 10 },
        { nom: "Boulettes panées", description: "Boulettes de viande panées et dorées", prix: "3000 FCFA", catégorie: ["Grillades"], filtre: ["Grillades"], image: "/boulettes-pane.jpeg", masque: false, stock: 10 },
        
        // Déjeuner
        { nom: "Riz sauté mbounga", description: "Riz sauté à la camerounaise", prix: "1000 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/riz-saute-mbounga.jpeg", masque: false, stock: 10 },
        { nom: "Riz sauté viande", description: "Riz sauté avec morceaux de viande", prix: "1500 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/riz-saute-viande.webp", masque: false, stock: 10 },
        { nom: "Poulet rôti", description: "Poulet rôti aux herbes et épices", prix: "3000 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/poulet-roti.jpeg", masque: false, stock: 10 },
        { nom: "Poulet sauce jardinière", description: "Poulet mijoté aux légumes du jardin", prix: "3000 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/poulet-sauce-jardiniere.jpeg", masque: false, stock: 10 },
        { nom: "Poulet sauce basquaise", description: "Poulet à la sauce basquaise épicée", prix: "3000 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/poulet-sauce-basquaise.jpeg", masque: false, stock: 10 },
        { nom: "Porc rôti", description: "Porc rôti tendre et juteux", prix: "3500 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/porc-roti.jpeg", masque: false, stock: 10 },
        { nom: "Porc sauce jardinière", description: "Porc mijoté aux légumes frais", prix: "3500 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/porc-sauce-basquaise.jpeg", masque: false, stock: 10 },
        { nom: "Porc à la moutarde", description: "Porc en sauce moutarde onctueuse", prix: "3500 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/porc-a-la-moutarde.jpeg", masque: false, stock: 10 },
        { nom: "Poisson à la sauce oignon", description: "Poisson frais en sauce aux oignons", prix: "2500 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/poisson-sauce-oignons.jpeg", masque: false, stock: 10 },
        { nom: "Burger", description: "Burger maison avec frites", prix: "2000 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/burger.jpeg", masque: false, stock: 10 },
        { nom: "Poisson d'eau douce à l'étouffée", description: "Poisson d'eau douce cuit à l'étouffée", prix: "3000 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/poisson-a-l'etouffee.jpeg", masque: false, stock: 10 },
        { nom: "Gombo couscous", description: "Gombo traditionnel avec couscous", prix: "3000 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/gombo-couscous.jpeg", masque: false, stock: 10 },
        { nom: "Légumes sautés", description: "Mélange de légumes sautés aux épices", prix: "3000 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/legumes-saute.jpeg", masque: false, stock: 10 },
        { nom: "Mbongo machoiron", description: "Plat traditionnel camerounais au poisson", prix: "3000 FCFA", catégorie: ["Déjeuner"], filtre: ["Déjeuner"], image: "/mbongo.jpeg", masque: false, stock: 10 },
        
        // Accompagnements
        { nom: "Bâton de manioc", description: "Bâton de manioc traditionnel", prix: "500 FCFA", catégorie: ["Accompagnements"], filtre: ["Accompagnements"], image: "/baton-manioc.jpg", masque: false, stock: 10 }
      ];
      
      // Ajouter tous les plats
      for (const plat of newPlats) {
        await addDoc(collection(db, 'Plats'), plat);
      }
      
      showToast(`${newPlats.length} nouveaux plats ajoutés avec succès !`, 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de l\'ajout des plats', 'error');
    }
  };

  // Fonction pour corriger les catégories dans Firebase
  const fixCategories = async () => {
    showModal(
      "Corriger les catégories",
      'Corriger toutes les catégories "Petit déjeuné" vers "Petit Déjeuner" dans Firebase ?',
      "info",
      async () => {
    
    try {
      const collections = ['Plats', 'Boissons'];
      let updated = 0;
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          let needsUpdate = false;
          const updates: any = {};
          
          // Corriger catégorie
          if (data.catégorie && Array.isArray(data.catégorie)) {
            const correctedCategorie = data.catégorie.map((cat: string) => 
              cat === 'Petit déjeuné' ? 'Petit Déjeuner' : cat
            );
            if (JSON.stringify(correctedCategorie) !== JSON.stringify(data.catégorie)) {
              updates.catégorie = correctedCategorie;
              needsUpdate = true;
            }
          }
          
          // Corriger filtre
          if (data.filtre && Array.isArray(data.filtre)) {
            const correctedFiltre = data.filtre.map((fil: string) => 
              fil === 'Petit déjeuné' ? 'Petit Déjeuner' : fil
            );
            if (JSON.stringify(correctedFiltre) !== JSON.stringify(data.filtre)) {
              updates.filtre = correctedFiltre;
              needsUpdate = true;
            }
          }
          
          if (needsUpdate) {
            await updateDoc(doc(db, collectionName, docSnapshot.id), updates);
            updated++;
          }
        }
      }
      
        showToast(`${updated} éléments corrigés avec succès !`, 'success');
        closeModal();
      } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la correction', 'error');
        closeModal();
      }
    },
    closeModal
    );
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

  // Optimisation: Mémoriser les filtres pour éviter les recalculs
  const filteredMouvements = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    return mouvements.filter(mouvement => {
      const mouvementDate = mouvement.date.toDate();
      
      // Filtre par période optimisé
      let periodMatch = true;
      switch (periodFilter) {
        case 'today':
          periodMatch = mouvementDate.toDateString() === todayStr;
          break;
        case 'week':
          periodMatch = mouvementDate >= weekAgo;
          break;
        case 'month':
          periodMatch = mouvementDate >= monthAgo;
          break;
      }
      
      return periodMatch && (typeFilter === 'all' || mouvement.categorie === typeFilter);
    });
  }, [mouvements, periodFilter, typeFilter]);

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
            <p>NIU: P067500122904X | Email: eatneo@gmail.com | Tél: 696 032 113</p>
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
          <p style="text-align: center;">NIU: P067500122904X | Email: eatneo@gmail.com | Tél: 696 032 113</p>
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

  // Optimisation: Mémoriser le filtrage des commandes
  const filteredHistorique = useMemo(() => {
    if (commandesPeriodFilter === 'all') return historique;
    
    const now = new Date();
    const todayStr = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    return historique.filter(commande => {
      const commandeDate = commande.dateCommande.toDate();
      
      switch (commandesPeriodFilter) {
        case 'today': return commandeDate.toDateString() === todayStr;
        case 'week': return commandeDate >= weekAgo;
        case 'month': return commandeDate >= monthAgo;
        default: return true;
      }
    });
  }, [historique, commandesPeriodFilter]);

  // Fonctions d'export pour les commandes
  const printCommandes = () => {
    const printContent = `
      <html>
        <head>
          <title>Rapport Commandes Livrées - Eat Neo</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2e7d32; padding-bottom: 20px; }
            .header h1 { color: #2e7d32; margin: 0; font-size: 28px; }
            .header p { margin: 5px 0; color: #666; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
            .stat-card { text-align: center; padding: 20px; border: 2px solid #ddd; border-radius: 8px; }
            .stat-card h3 { margin: 0 0 10px 0; color: #2e7d32; }
            .stat-card .number { font-size: 24px; font-weight: bold; margin: 0; }
            .stat-card .number.green { color: #4caf50; }
            .stat-card .number.orange { color: #ff9800; }
            .stat-card .number.blue { color: #2196f3; }
            .section { margin: 30px 0; }
            .section h2 { color: #2e7d32; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2e7d32; color: white; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            .total-row { background-color: #f5f5f5; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Eat Neo - Rapport Commandes Livrées</h1>
            <p>NIU: P067500122904X | Email: eatneo@gmail.com | Tél: 696 032 113</p>
            <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
            <p>Système de gestion des commandes</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <h3>Total Livré</h3>
              <p class="number green">${filteredHistorique.length}</p>
            </div>
            <div class="stat-card">
              <h3>Chiffre d'Affaires</h3>
              <p class="number orange">${filteredHistorique.reduce((total, cmd) => total + cmd.total, 0).toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div class="stat-card">
              <h3>Moyenne/Commande</h3>
              <p class="number blue">${filteredHistorique.length > 0 ? Math.round(filteredHistorique.reduce((total, cmd) => total + cmd.total, 0) / filteredHistorique.length).toLocaleString('fr-FR') : 0} FCFA</p>
            </div>
          </div>
          
          <div class="section">
            <h2>Détail des Commandes Livrées</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Localisation</th>
                  <th>Articles</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${filteredHistorique.map(cmd => `
                  <tr>
                    <td>${formatDate(cmd.dateCommande)}</td>
                    <td>${cmd.clientPrenom} ${cmd.clientNom}</td>
                    <td>${cmd.localisation}</td>
                    <td>${cmd.items.map(item => `${item.nom} × ${item.quantité}`).join(', ')}</td>
                    <td>${formatPrixCommande(cmd.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Eat Neo - Système de gestion des commandes</p>
          </div>
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

  const exportCommandesToExcel = () => {
    const csvContent = [
      ['Date', 'Client', 'Localisation', 'Articles', 'Total'],
      ...filteredHistorique.map(cmd => [
        formatDate(cmd.dateCommande),
        `${cmd.clientPrenom} ${cmd.clientNom}`,
        cmd.localisation,
        cmd.items.map(item => `${item.nom} × ${item.quantité}`).join(', '),
        cmd.total
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `commandes-livrees-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportCommandesToWord = () => {
    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head>
          <meta charset='utf-8'>
          <title>Rapport Commandes Livrées - Eat Neo</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2e7d32; padding-bottom: 20px; }
            .header h1 { color: #2e7d32; margin: 0; font-size: 28px; }
            .header p { margin: 5px 0; color: #666; }
            .stats-section { margin: 30px 0; }
            .stats-section h2 { color: #2e7d32; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .stats-list { margin: 15px 0; }
            .stats-list p { margin: 8px 0; font-size: 16px; }
            .section { margin: 30px 0; }
            .section h2 { color: #2e7d32; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2e7d32; color: white; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Eat Neo - Rapport Commandes Livrées</h1>
            <p>NIU: P067500122904X | Email: eatneo@gmail.com | Tél: 696 032 113</p>
            <p>Période: ${commandesPeriodFilter}</p>
            <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
            <p>Système de gestion des commandes</p>
          </div>
          
          <div class="stats-section">
            <h2>Statistiques de Performance</h2>
            <div class="stats-list">
              <p><strong>Total commandes livrées:</strong> ${filteredHistorique.length}</p>
              <p><strong>Chiffre d'affaires total:</strong> ${filteredHistorique.reduce((total, cmd) => total + cmd.total, 0).toLocaleString('fr-FR')} FCFA</p>
              <p><strong>Moyenne par commande:</strong> ${filteredHistorique.length > 0 ? Math.round(filteredHistorique.reduce((total, cmd) => total + cmd.total, 0) / filteredHistorique.length).toLocaleString('fr-FR') : 0} FCFA</p>
            </div>
          </div>
          
          <div class="section">
            <h2>Détail des Commandes Livrées</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Localisation</th>
                  <th>Articles</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${filteredHistorique.map(cmd => `
                  <tr>
                    <td>${formatDate(cmd.dateCommande)}</td>
                    <td>${cmd.clientPrenom} ${cmd.clientNom}</td>
                    <td>${cmd.localisation}</td>
                    <td>${cmd.items.map(item => `${item.nom} × ${item.quantité}`).join(', ')}</td>
                    <td>${formatPrixCommande(cmd.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Eat Neo - Système de gestion des commandes</p>
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([wordContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `commandes-livrees-${new Date().toISOString().split('T')[0]}.doc`;
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
      <div className="admin-header">
        <h1 className="admin-title">Back Office - Administration</h1>
      </div>
      
      {/* Onglets */}
      <AdminTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        commandesCount={commandes.filter(c => c.statut !== 'livree').length}
        userRole={userRole}
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
        {filteredPlats.map(item => (
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
        {filteredBoissons.map(item => (
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
            stockFilter={stockFilter}
            setStockFilter={setStockFilter}
            onInitializeStock={initializeStock}
            onResetLowStock={resetLowStock}
            onAddBoisson={() => setShowAddBoisson(true)}
            onExportStockReport={exportStockReport}
            boissonsCount={boissons.length}
            lowStockCount={stockStats.boissons.low}
            outOfStockCount={stockStats.boissons.out}
            okStockCount={stockStats.boissons.ok}
            platsCount={plats.length}
            lowPlatsCount={stockStats.plats.low}
            outOfStockPlatsCount={stockStats.plats.out}
            okPlatsCount={stockStats.plats.ok}
          />



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
            {filteredStockBoissons.map(item => {
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
                    {userRole === 'admin' && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newStock = Math.max(0, (item.stock || 0) - 1);
                          setPendingStockChange({
                            itemId: String(item.id),
                            newStock,
                            collection: "Boissons"
                          });
                        }}
                        className="stock-btn-minus-hover"
                        title="Diminuer le stock (Admin seulement)"
                      >
                        <MinusIcon />
                      </button>
                    )}
                    
                    <input
                      type="number"
                      value={item.stock || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setPendingStockChange({
                          itemId: String(item.id),
                          newStock: value,
                          collection: "Boissons"
                        });
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newStock = (item.stock || 0) + 1;
                        setPendingStockChange({
                          itemId: String(item.id),
                          newStock,
                          collection: "Boissons"
                        });
                      }}
                      className="stock-btn-plus-hover"
                      title="Augmenter le stock"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="stock-actions-row">
                    {pendingStockChange?.itemId === String(item.id) ? (
                      <>
                        <button
                          onClick={confirmStockChange}
                          className="stock-confirm-btn"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={cancelStockChange}
                          className="stock-cancel-btn"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDelete("Boissons", String(item.id))}
                        className="ingredient-btn-delete"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
            </>
          )}

          {/* Gestion des Plats */}
          {stockView === 'plats' && (
            <>
              <h3 className="stock-section-title">Plats ({plats.length})</h3>
              
              <div className="stock-grid-container">
            {filteredStockPlats.map(item => {
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
                    {userRole === 'admin' && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newStock = Math.max(0, (item.stock || 0) - 1);
                          setPendingStockChange({
                            itemId: String(item.id),
                            newStock,
                            collection: "Plats"
                          });
                        }}
                        className="stock-btn-minus-hover"
                        title="Diminuer le stock (Admin seulement)"
                      >
                        <MinusIcon />
                      </button>
                    )}
                    
                    <input
                      type="number"
                      value={item.stock || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setPendingStockChange({
                          itemId: String(item.id),
                          newStock: value,
                          collection: "Plats"
                        });
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newStock = (item.stock || 0) + 1;
                        setPendingStockChange({
                          itemId: String(item.id),
                          newStock,
                          collection: "Plats"
                        });
                      }}
                      className="stock-btn-plus-hover"
                      title="Augmenter le stock"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="stock-actions-row">
                    {pendingStockChange?.itemId === String(item.id) ? (
                      <>
                        <button
                          onClick={confirmStockChange}
                          className="stock-confirm-btn"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={cancelStockChange}
                          className="stock-cancel-btn"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDelete("Plats", String(item.id))}
                        className="ingredient-btn-delete"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
            </>
          )}
    </div>
  )}

      {/* Contenu de l'onglet Rentabilité - Admin seulement */}
      {activeTab === 'rentabilite' && userRole === 'admin' && (
        <ProfitAnalysis />
      )}

      {/* Contenu de l'onglet Historique - Admin seulement */}
      {activeTab === 'historique' && userRole === 'admin' && (
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
              {/* Filtres et actions pour les commandes */}
              <div className="mouvements-filters">
                <div className="filter-group">
                  <label>Période:</label>
                  <select 
                    value={commandesPeriodFilter} 
                    onChange={(e) => setCommandesPeriodFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                    <option value="all">Toutes</option>
                  </select>
                </div>
                
                <div className="mouvements-actions">
                  <button onClick={printCommandes} className="action-btn print">
                    Imprimer
                  </button>
                  <button onClick={exportCommandesToExcel} className="action-btn excel">
                    Excel
                  </button>
                  <button onClick={exportCommandesToWord} className="action-btn word">
                    Word
                  </button>
                </div>
              </div>

              {/* Statistiques de l'historique */}
              <div className="historique-stats-grid">
                <div className="historique-stat-card">
                  <h4 className="historique-stat-title">Total Livré</h4>
                  <p className="historique-stat-number green">
                    {filteredHistorique.length}
                  </p>
                </div>
                <div className="historique-stat-card">
                  <h4 className="historique-stat-title">Chiffre d'Affaires</h4>
                  <p className="historique-stat-number orange small">
                    {filteredHistorique.reduce((total, cmd) => total + cmd.total, 0).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div className="historique-stat-card">
                  <h4 className="historique-stat-title">Moyenne/Commande</h4>
                  <p className="historique-stat-number blue small">
                    {filteredHistorique.length > 0 ? Math.round(filteredHistorique.reduce((total, cmd) => total + cmd.total, 0) / filteredHistorique.length).toLocaleString('fr-FR') : 0} FCFA
                  </p>
                </div>
              </div>

              {filteredHistorique.length === 0 ? (
                <div className="historique-empty-container">
                  <HistoryIcon />
                  <h3 className="historique-empty-title">Aucune commande dans l'historique</h3>
                  <p className="historique-empty-text">Les commandes livrées apparaitront ici</p>
                </div>
              ) : (
                <div className="historique-list-container">
                  {filteredHistorique.map((commande) => (
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
