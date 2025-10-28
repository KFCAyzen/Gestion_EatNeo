'use client'

import { useState } from 'react'
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
import '@/styles/AdminPage.css'
import { menuItems, drinksItems } from "./types";
import { images } from "./imagesFallback";
import { useEffect } from "react";

// Composants d'icônes SVG personnalisées
const MenuIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 12h18M3 6h18M3 18h18" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const OrdersIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StockIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2"/>
    <path d="M7 10H17M7 14H13" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const HistoryIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="#4CAF50" strokeWidth="2"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1749 15.0074 10.8016 14.8565C10.4283 14.7056 10.0887 14.4811 9.80385 14.1962C9.51900 13.9113 9.29449 13.5717 9.14359 13.1984C8.99269 12.8251 8.91855 12.4247 8.92563 12.0219C8.93271 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 1L23 23" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MinusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M5 12H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="8" stroke="#666" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icônes pour la bottom bar
const HomeIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22V12H15V22" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CartIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="8" cy="21" r="1" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="21" r="1" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.05 2.05H4L6.2 12.6C6.37245 13.3923 6.76768 14.1154 7.33677 14.6846C7.90586 15.2538 8.62797 15.6423 9.42 15.8L18 16C18.7923 15.9977 19.5154 15.6023 20.0846 15.0332C20.6538 14.4641 21.0423 13.742 21.25 12.95L22 8H5.12" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AdminIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 15C16.4183 15 20 11.4183 20 7C20 2.58172 16.4183 -1 12 -1C7.58172 -1 4 2.58172 4 7C4 11.4183 7.58172 15 12 15Z" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke={active ? "#FF6B35" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Composant Spinner personnalisé
const Spinner = ({ size = 40, color = "#FF6B35" }: { size?: number; color?: string }) => (
  <div 
    className={`spinner ${color === 'white' ? 'white' : ''}`}
    style={{ width: `${size}px`, height: `${size}px` }}
  />
);

// Spinner avec texte
const LoadingSpinner = ({ text = "Chargement...", size = 40 }: { text?: string; size?: number }) => (
  <div className="loading-spinner-container">
    <Spinner size={size} />
    <span className="loading-spinner-text">
      {text}
    </span>
  </div>
);

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

  // Gestion du stock
  const updateStock = async (collectionName: "Plats" | "Boissons", id: string, newStock: number) => {
    const finalStock = Math.max(0, newStock);
    try {
      await updateDoc(doc(db, collectionName, id), {
        stock: finalStock
      });
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
    const allItems = [...boissons];
    const lowStockItems = boissons.filter(item => (item.stock || 0) <= 5);
    const outOfStockItems = boissons.filter(item => (item.stock || 0) === 0);
    const lowIngredients = ingredients.filter(ing => ing.quantite <= ing.seuilAlerte);
    
    const report = {
      date: new Date().toLocaleString('fr-FR'),
      boissons: {
        total: boissons.length,
        lowStock: boissons.filter(item => (item.stock || 0) <= 5).length,
        outOfStock: boissons.filter(item => (item.stock || 0) === 0).length,
        items: boissons.map(item => ({
          nom: item.nom,
          stock: item.stock || 0,
          status: (item.stock || 0) === 0 ? 'Rupture' : (item.stock || 0) <= 5 ? 'Stock faible' : 'OK'
        }))
      },
      ingredients: {
        total: ingredients.length,
        lowStock: lowIngredients.length,
        items: ingredients.map(ing => ({
          nom: ing.nom,
          quantite: ing.quantite,
          unite: ing.unite,
          seuilAlerte: ing.seuilAlerte,
          status: ing.quantite <= ing.seuilAlerte ? 'Stock faible' : 'OK'
        }))
      }
    };
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-stock-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
      await updateDoc(doc(db, 'ingredients', id), {
        quantite: Math.max(0, newQuantite)
      });
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
      <div className="admin-tabs">
        <button 
          onClick={() => setActiveTab('menu')}
          className={`admin-tab-btn ${activeTab === 'menu' ? 'active' : ''} admin-tab-btn-flex`}
        >
          <MenuIcon active={activeTab === 'menu'} />
          <span>Gestion du Menu</span>
        </button>
        <button 
          onClick={() => setActiveTab('commandes')}
          className={`admin-tab-btn ${activeTab === 'commandes' ? 'active' : ''} admin-tab-btn-flex`}
        >
          <OrdersIcon active={activeTab === 'commandes'} />
          <span>Commandes ({commandes.filter(c => c.statut !== 'livree').length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('stock')}
          className={`admin-tab-btn ${activeTab === 'stock' ? 'active' : ''} admin-tab-btn-flex`}
        >
          <StockIcon active={activeTab === 'stock'} />
          <span>Stock</span>
        </button>
        <button 
          onClick={() => setActiveTab('historique')}
          className={`admin-tab-btn ${activeTab === 'historique' ? 'active' : ''} admin-tab-btn-flex`}
        >
          <HistoryIcon active={activeTab === 'historique'} />
          <span>Historique</span>
        </button>
      </div>

      {/* Contenu de l'onglet Menu */}
      {activeTab === 'menu' && (
        <>
          {/* Formulaire ajout item */}
          <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Nom"
            value={nom}
            onChange={e => setNom(e.target.value)}
            required
            className="form-input"
          />
        </div>
        
        <div className="form-row">
          <textarea
            placeholder={categorie === "boissons" ? "Description (optionnel)" : "Description"}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            required={categorie !== "boissons"}
            className="form-textarea"
          />
        </div>

        <div className="price-options-section">
          <p className="section-title">
            <strong>Prix :</strong>
          </p>
          {prix.map((opt, idx) => (
            <div key={idx} className="price-option">
              <input
                type="text"
                placeholder={prix.length >= 2 ? "Label (obligatoire)" : "Label (facultatif)"}
                value={opt.label || ""}
                onChange={e => updatePriceOption(idx, "label", e.target.value)}
                className="price-input"
                required={prix.length >= 2}
              />
              <input
                type="text"
                placeholder="Valeur"
                value={opt.value || ""}
                onChange={e => updatePriceOption(idx, "value", e.target.value)}
                className="price-input"
              />
              <button type="button" onClick={() => removePriceOption(idx)} className="remove-price-btn">
                <MinusIcon />
              </button>
            </div>
          ))}
          <button type="button" onClick={addPriceOption} className="add-price-btn">
            Ajouter une option de prix
          </button>
        </div>

        <div className="form-row-group">
          {/* Collection (pour routage uniquement) */}
          <div className="form-field">
            <label className="field-label">
              <strong>Collection :</strong>
            </label>
            <select value={categorie} onChange={e => setCategorie(e.target.value)} className="form-select">
              <option value="plats">Plats</option>
              <option value="boissons">Boissons</option>
            </select>
          </div>

          {/* Filtre (pour organisation et affichage) */}
          <div className="form-field">
            <label className="field-label">
              <strong>Catégorie/Filtre :</strong>
            </label>
            <input
              type="text"
              placeholder="Ex : Entrées, Plats principaux, Desserts..."
              value={filtre}
              onChange={e => setFiltre(e.target.value)}
              required
              className="form-input"
            />
          </div>
        </div>

        <div
          className={`drop-zone-container ${uploading ? "uploading" : ""}`}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <UploadIcon />
          {uploading && <Spinner size={20} />}
          <span className="drop-zone-text">
            {uploading ? "Upload en cours..." : "Glissez-déposez une image ou cliquez"}
          </span>
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            className="file-input-hidden"
            onChange={handleFileSelect}
          />
        </div>

        {imageUrl && (
          <div className="preview-container">
            <img src={imageUrl} alt="Aperçu" className="preview-image" />
          </div>
        )}
        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={uploading} className="submit-button">
          {uploading && <Spinner size={16} color="white" />}
          {uploading ? "Upload..." : editId ? "Modifier" : "Ajouter"}
        </button>
      </form>

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
          
          {/* Statistiques du stock */}
          <div className="stock-stats-grid">
            {stockView === 'boissons' ? (
              <>
                <div className="stock-stat-card">
                  <h4 className="stock-stat-title">Total Boissons</h4>
                  <p className="stock-stat-number blue">
                    {boissons.length}
                  </p>
                </div>
                <div className="stock-stat-card">
                  <h4 className="stock-stat-title">Stock Faible</h4>
                  <p className="stock-stat-number orange">
                    {boissons.filter(item => (item.stock || 0) <= 5 && (item.stock || 0) > 0).length}
                  </p>
                </div>
                <div className="stock-stat-card">
                  <h4 className="stock-stat-title">Rupture</h4>
                  <p className="stock-stat-number red">
                    {boissons.filter(item => (item.stock || 0) === 0).length}
                  </p>
                </div>
                <div className="stock-stat-card">
                  <h4 className="stock-stat-title">Stock OK</h4>
                  <p className="stock-stat-number green">
                    {boissons.filter(item => (item.stock || 0) > 5).length}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="stock-stat-card">
                  <h4 className="stock-stat-title">Total Ingrédients</h4>
                  <p className="stock-stat-number blue">
                    {ingredients.length}
                  </p>
                </div>
                <div className="stock-stat-card">
                  <h4 className="stock-stat-title">Stock Faible</h4>
                  <p className="stock-stat-number orange">
                    {ingredients.filter(ing => ing.quantite <= ing.seuilAlerte).length}
                  </p>
                </div>
                <div className="stock-stat-card">
                  <h4 className="stock-stat-title">Stock OK</h4>
                  <p className="stock-stat-number green">
                    {ingredients.filter(ing => ing.quantite > ing.seuilAlerte).length}
                  </p>
                </div>
                <div className="stock-stat-card">
                  <h4 className="stock-stat-title">Unités Totales</h4>
                  <p className="stock-stat-number purple">
                    {ingredients.reduce((total, ing) => total + ing.quantite, 0)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Sous-onglets Stock */}
          <div className="stock-tabs-container">
            <button
              onClick={() => setStockView('boissons')}
              className={`stock-tab-button ${stockView === 'boissons' ? 'active' : 'inactive'}`}
            >
              Boissons
            </button>
            <button
              onClick={() => setStockView('ingredients')}
              className={`stock-tab-button ${stockView === 'ingredients' ? 'active' : 'inactive'}`}
            >
              Ingrédients
            </button>
          </div>

          {/* Actions de gestion */}
          <div className="stock-actions-container">
            <button
              onClick={initializeStock}
              className="stock-action-button green"
            >
              Initialiser tout (10)
            </button>
            <button
              onClick={resetLowStock}
              className="stock-action-button orange"
            >
              Remettre stock faible (10)
            </button>
            {stockView === 'boissons' && (
              <button
                onClick={() => setShowAddBoisson(true)}
                className="stock-action-button light-green stock-action-button-flex"
              >
                <PlusIcon />
                Ajouter boisson
              </button>
            )}
            {stockView === 'ingredients' && (
              <>
                <button
                  onClick={() => setShowAddIngredient(true)}
                  className="stock-action-button light-green stock-action-button-flex"
                >
                  <PlusIcon />
                  Ajouter ingrédient
                </button>
                <button
                  onClick={initializeBaseIngredients}
                  className="stock-action-button blue stock-action-button-flex"
                >
                  Initialiser ingrédients de base
                </button>
              </>
            )}
            <button
              onClick={exportStockReport}
              className="stock-action-button purple stock-action-button-flex"
            >
              <DownloadIcon />
              Exporter rapport
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
            {boissons.map(item => {
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
            {ingredients.map(ingredient => {
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
          <h2>Historique des Commandes</h2>
          
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
