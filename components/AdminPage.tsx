'use client'

import { useState } from 'react'
import { db, storage } from "./firebase";
import { collection, addDoc, doc, deleteDoc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { uploadImageFromBrowser } from "./upLoadFirebase";
import type { MenuItem } from "./types";
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 5V19M5 12H19" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M5 12H19" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
  <div style={{
    display: 'inline-block',
    width: size,
    height: size,
    border: `3px solid rgba(255, 107, 53, 0.2)`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }} />
);

// Spinner avec texte
const LoadingSpinner = ({ text = "Chargement...", size = 40 }: { text?: string; size?: number }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '40px 20px'
  }}>
    <Spinner size={size} />
    <span style={{
      color: '#666',
      fontSize: '14px',
      fontWeight: '500'
    }}>
      {text}
    </span>
  </div>
);

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

      alert(editId ? "Item modifié avec succès !" : "Item ajouté avec succès !");
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
    if (!window.confirm("Supprimer cet item ?")) return;
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
      alert("Item supprimé !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
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
      alert('Statut mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du statut');
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
    try {
      await updateDoc(doc(db, collectionName, id), {
        stock: Math.max(0, newStock)
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      alert('Erreur lors de la mise à jour du stock');
    }
  };

  const initializeStock = async () => {
    if (!window.confirm('Initialiser le stock à 10 pour tous les items ?')) return;
    try {
      const collections = ['Plats', 'Boissons'];
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
    await updateStock(collectionName, id, newStock);
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
    if (!window.confirm('Remettre à 10 tous les items avec stock faible (≤5) ?')) return;
    try {
      const collections = ['Plats', 'Boissons'];
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
      alert(`${updated} items avec stock faible ont été remis à 10 !`);
    } catch (error) {
      console.error('Erreur lors de la remise à niveau:', error);
      alert('Erreur lors de la remise à niveau du stock');
    }
  };

  const exportStockReport = () => {
    const allItems = [...plats, ...boissons];
    const lowStockItems = allItems.filter(item => (item.stock || 0) <= 5);
    const outOfStockItems = allItems.filter(item => (item.stock || 0) === 0);
    
    const report = {
      date: new Date().toLocaleString('fr-FR'),
      totalItems: allItems.length,
      lowStock: lowStockItems.length,
      outOfStock: outOfStockItems.length,
      items: allItems.map(item => ({
        nom: item.nom,
        stock: item.stock || 0,
        status: (item.stock || 0) === 0 ? 'Rupture' : (item.stock || 0) <= 5 ? 'Stock faible' : 'OK'
      }))
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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
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
          className={`admin-tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <MenuIcon active={activeTab === 'menu'} />
          <span>Gestion du Menu</span>
        </button>
        <button 
          onClick={() => setActiveTab('commandes')}
          className={`admin-tab-btn ${activeTab === 'commandes' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <OrdersIcon active={activeTab === 'commandes'} />
          <span>Commandes ({commandes.filter(c => c.statut !== 'livree').length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('stock')}
          className={`admin-tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <StockIcon active={activeTab === 'stock'} />
          <span>Stock</span>
        </button>
        <button 
          onClick={() => setActiveTab('historique')}
          className={`admin-tab-btn ${activeTab === 'historique' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
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
              <button type="button" onClick={() => removePriceOption(idx)} className="remove-btn" style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
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
          className={`drop-zone ${uploading ? "active" : ""}`}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => document.getElementById("fileInput")?.click()}
          style={{
            border: '2px dashed #ddd',
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: uploading ? '#f5f5f5' : 'white',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <UploadIcon />
          {uploading && <Spinner size={20} />}
          <span style={{ color: '#666', fontSize: '14px' }}>
            {uploading ? "Upload en cours..." : "Glissez-déposez une image ou cliquez"}
          </span>
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
        </div>

        {imageUrl && (
          <div className="preview">
            <img src={imageUrl} alt="Aperçu" className="item-img" />
          </div>
        )}
        {error && <p style={{ color: "#e53935" }}>{error}</p>}

        <button type="submit" disabled={uploading} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          {uploading && <Spinner size={16} color="white" />}
          {uploading ? "Upload..." : editId ? "Modifier" : "Ajouter"}
        </button>
      </form>

      {/* Barre de recherche */}
      <div className="search-section" style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', display: 'inline-block', width: '300px' }}>
          <SearchIcon />
          <input
            type="search"
            placeholder="Rechercher un item..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
            style={{
              paddingLeft: '40px',
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <SearchIcon />
          </div>
        </div>
        <button
          onClick={migrateExistingItems}
          style={{
            marginLeft: '10px',
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Mettre à jour les items
        </button>
        <button
          onClick={resetAndReuploadItems}
          style={{
            marginLeft: '10px',
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset & Re-upload
        </button>
      </div>

      {/* Debug info */}
      <div style={{ padding: '10px', backgroundColor: '#f5f5f5', margin: '10px 0', borderRadius: '4px' }}>
        <p><strong>Debug:</strong> Plats: {plats.length} items | Boissons: {boissons.length} items</p>
        {plats.length === 0 && <p style={{ color: 'orange' }}>Aucun plat trouvé dans Firestore</p>}
        {boissons.length === 0 && <p style={{ color: 'orange' }}>Aucune boisson trouvée dans Firestore</p>}
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
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="edit-btn"
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
                style={{
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <EditIcon />
                Modifier
              </button>
              <button
                className={item.masque ? "show-btn" : "hide-btn"}
                onClick={() => toggleItemVisibility("Plats", String(item.id), item.masque || false)}
                style={{
                  backgroundColor: item.masque ? '#4caf50' : '#ff9800',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {item.masque ? <EyeIcon /> : <EyeOffIcon />}
                {item.masque ? 'Afficher' : 'Masquer'}
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete("Plats", String(item.id))}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
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
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="edit-btn"
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
                style={{
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <EditIcon />
                Modifier
              </button>
              <button
                className={item.masque ? "show-btn" : "hide-btn"}
                onClick={() => toggleItemVisibility("Boissons", String(item.id), item.masque || false)}
                style={{
                  backgroundColor: item.masque ? '#4caf50' : '#ff9800',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {item.masque ? <EyeIcon /> : <EyeOffIcon />}
                {item.masque ? 'Afficher' : 'Masquer'}
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete("Boissons", String(item.id))}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
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
                        className="commande-status-select"
                        style={{ backgroundColor: getStatutColor(commande.statut) }}
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
          <div className="stock-stats" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <div className="stat-card" style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Total Items</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#2196f3' }}>
                {plats.length + boissons.length}
              </p>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Stock Faible</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#ff9800' }}>
                {[...plats, ...boissons].filter(item => (item.stock || 0) <= 5 && (item.stock || 0) > 0).length}
              </p>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Rupture</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#f44336' }}>
                {[...plats, ...boissons].filter(item => (item.stock || 0) === 0).length}
              </p>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Stock OK</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#4caf50' }}>
                {[...plats, ...boissons].filter(item => (item.stock || 0) > 5).length}
              </p>
            </div>
          </div>

          {/* Actions de gestion */}
          <div className="stock-actions" style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={initializeStock}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2e7d32',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Initialiser tout (10)
            </button>
            <button
              onClick={resetLowStock}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Remettre stock faible (10)
            </button>
            <button
              onClick={exportStockReport}
              style={{
                padding: '10px 20px',
                backgroundColor: '#9c27b0',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <DownloadIcon />
              Exporter rapport
            </button>
          </div>

          <h3 style={{ color: '#2c3e50', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Plats ({plats.length})</h3>
          <div className="stock-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {plats.map(item => {
              const stockLevel = item.stock || 0;
              const isOutOfStock = stockLevel === 0;
              const isLowStock = stockLevel <= 5 && stockLevel > 0;
              const isGoodStock = stockLevel > 5;
              
              return (
                <div key={item.id} className="stock-card" style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: `2px solid ${isOutOfStock ? '#f44336' : isLowStock ? '#ff9800' : '#4caf50'}`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}>
                  {/* Badge de statut */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor: isOutOfStock ? '#f44336' : isLowStock ? '#ff9800' : '#4caf50',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    {isOutOfStock ? 'Rupture' : isLowStock ? 'Faible' : 'OK'}
                  </div>
                  
                  {/* Image et nom */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    {item.image && (
                      <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}>
                        <img 
                          src={item.image} 
                          alt={item.nom} 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }} 
                        />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: '#2c3e50',
                        lineHeight: '1.3'
                      }}>
                        {item.nom}
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        Stock actuel: <span style={{ 
                          color: isOutOfStock ? '#f44336' : isLowStock ? '#ff9800' : '#4caf50',
                          fontWeight: '700',
                          fontSize: '16px'
                        }}>{stockLevel}</span> unités
                      </p>
                    </div>
                  </div>
                  
                  {/* Contrôles de stock */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: 'rgba(248, 249, 250, 0.8)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <button 
                      onClick={() => updateStock("Plats", String(item.id), (item.stock || 0) - 1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(244, 67, 54, 0.3)';
                      }}
                    >
                      <MinusIcon />
                    </button>
                    
                    <input
                      type="number"
                      value={item.stock || 0}
                      onChange={(e) => setStockValue("Plats", String(item.id), e.target.value)}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '10px 12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        backgroundColor: 'white',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#FF6B35';
                        e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e0e0e0';
                        e.target.style.boxShadow = 'none';
                      }}
                      min="0"
                    />
                    
                    <button 
                      onClick={() => updateStock("Plats", String(item.id), (item.stock || 0) + 1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';
                      }}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <h3 style={{ color: '#2c3e50', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Boissons ({boissons.length})</h3>
          <div className="stock-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {boissons.map(item => {
              const stockLevel = item.stock || 0;
              const isOutOfStock = stockLevel === 0;
              const isLowStock = stockLevel <= 5 && stockLevel > 0;
              const isGoodStock = stockLevel > 5;
              
              return (
                <div key={item.id} className="stock-card" style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: `2px solid ${isOutOfStock ? '#f44336' : isLowStock ? '#ff9800' : '#4caf50'}`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}>
                  {/* Badge de statut */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor: isOutOfStock ? '#f44336' : isLowStock ? '#ff9800' : '#4caf50',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    {isOutOfStock ? 'Rupture' : isLowStock ? 'Faible' : 'OK'}
                  </div>
                  
                  {/* Image et nom */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    {item.image && (
                      <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}>
                        <img 
                          src={item.image} 
                          alt={item.nom} 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }} 
                        />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: '#2c3e50',
                        lineHeight: '1.3'
                      }}>
                        {item.nom}
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        Stock actuel: <span style={{ 
                          color: isOutOfStock ? '#f44336' : isLowStock ? '#ff9800' : '#4caf50',
                          fontWeight: '700',
                          fontSize: '16px'
                        }}>{stockLevel}</span> unités
                      </p>
                    </div>
                  </div>
                  
                  {/* Contrôles de stock */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: 'rgba(248, 249, 250, 0.8)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <button 
                      onClick={() => updateStock("Boissons", String(item.id), (item.stock || 0) - 1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(244, 67, 54, 0.3)';
                      }}
                    >
                      <MinusIcon />
                    </button>
                    
                    <input
                      type="number"
                      value={item.stock || 0}
                      onChange={(e) => setStockValue("Boissons", String(item.id), e.target.value)}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '10px 12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        backgroundColor: 'white',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#FF6B35';
                        e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e0e0e0';
                        e.target.style.boxShadow = 'none';
                      }}
                      min="0"
                    />
                    
                    <button 
                      onClick={() => updateStock("Boissons", String(item.id), (item.stock || 0) + 1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';
                      }}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contenu de l'onglet Historique */}
      {activeTab === 'historique' && (
        <div className="historique-section">
          <h2>Historique des Commandes</h2>
          
          {/* Statistiques de l'historique */}
          <div className="historique-stats" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div className="stat-card" style={{ textAlign: 'center', padding: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Total Livré</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#4CAF50' }}>
                {historique.length}
              </p>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', padding: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Chiffre d'Affaires</h4>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#FF6B35' }}>
                {historique.reduce((total, cmd) => total + cmd.total, 0).toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', padding: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Moyenne/Commande</h4>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#2196F3' }}>
                {historique.length > 0 ? Math.round(historique.reduce((total, cmd) => total + cmd.total, 0) / historique.length).toLocaleString('fr-FR') : 0} FCFA
              </p>
            </div>
          </div>

          {historique.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <HistoryIcon />
              <h3 style={{ color: '#666', marginTop: '20px' }}>Aucune commande dans l'historique</h3>
              <p style={{ color: '#999' }}>Les commandes livrées apparaitront ici</p>
            </div>
          ) : (
            <div className="historique-list" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {historique.map((commande) => (
                <div key={commande.id} style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      <h3 style={{
                        margin: '0 0 5px 0',
                        color: '#2c3e50',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}>
                        {commande.clientPrenom} {commande.clientNom}
                      </h3>
                      <p style={{
                        margin: 0,
                        color: '#666',
                        fontSize: '14px'
                      }}>
                        {formatDate(commande.dateCommande)} • {commande.localisation}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      <span style={{
                        padding: '6px 12px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        Livrée
                      </span>
                      <p style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#FF6B35'
                      }}>
                        {formatPrixCommande(commande.total)}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '15px',
                    backgroundColor: 'rgba(248, 249, 250, 0.8)',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <h4 style={{
                      margin: '0 0 10px 0',
                      color: '#2c3e50',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>Articles commandés:</h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '8px'
                    }}>
                      {commande.items.map((item, index) => (
                        <div key={index} style={{
                          padding: '8px 12px',
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#555'
                        }}>
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

    </div>
  );
}
