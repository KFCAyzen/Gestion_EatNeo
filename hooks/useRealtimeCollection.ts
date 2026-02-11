'use client'

import { useEffect, useState, useMemo } from "react";
import { db } from '@/components/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import type { MenuItem } from '@/components/types'
import { menuItems } from '@/components/types'

// Cache global pour éviter les requêtes multiples
const collectionsCache = new Map<string, MenuItem[]>()
const subscriptionsCache = new Map<string, (() => void)[]>()

export function useRealtimeCollection(collectionName: string) {
  const [items, setItems] = useState<MenuItem[]>(() => collectionsCache.get(collectionName) || []);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Optimisation: Mémoriser la référence de collection
  const collectionRef = useMemo(() => collection(db, collectionName), [collectionName]);

  useEffect(() => {
    // Vérifier si on a déjà des données en cache
    const cachedData = collectionsCache.get(collectionName);
    if (cachedData && cachedData.length > 0) {
      setItems(cachedData);
      setLoading(false);
    }
    
    // Timeout pour mode hors ligne
    const offlineTimeout = setTimeout(() => {
      if (loading) {
        console.log('Mode hors ligne détecté, utilisation des données locales');
        setItems(menuItems);
        setLoading(false);
        setError(null);
      }
    }, 3000);
    
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        clearTimeout(offlineTimeout);
        // Optimisation: Traitement batch des documents
        const docs: MenuItem[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          docs.push({
            id: docSnap.id,
            nom: data.nom ?? "",
            description: data.description ?? "",
            prix: data.prix,
            image: data.image ?? "",
            catégorie: Array.isArray(data.catégorie) ? data.catégorie : [],
            filtre: Array.isArray(data.filtre) ? data.filtre : [],
            masque: data.masque ?? false,
            stock: data.stock ?? 0,
          } as MenuItem);
        });
        
        // Mettre à jour le cache global
        collectionsCache.set(collectionName, docs);
        setItems(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        clearTimeout(offlineTimeout);
        console.error(`Error listening to ${collectionName}:`, err);
        // En cas d'erreur, utiliser les données locales
        setItems(menuItems);
        setLoading(false);
        setError(null);
      }
    );
    
    // Gérer les souscriptions multiples
    const existingSubs = subscriptionsCache.get(collectionName) || [];
    existingSubs.push(unsubscribe);
    subscriptionsCache.set(collectionName, existingSubs);
    
    return () => {
      clearTimeout(offlineTimeout);
      unsubscribe();
      // Nettoyer la souscription du cache
      const subs = subscriptionsCache.get(collectionName) || [];
      const index = subs.indexOf(unsubscribe);
      if (index > -1) {
        subs.splice(index, 1);
        subscriptionsCache.set(collectionName, subs);
      }
    };
  }, [collectionName, collectionRef]);

  // Optimisation: Mémoriser les items triés
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.nom || '').localeCompare(b.nom || '')),
    [items]
  );

  return { items: sortedItems, loading, error } as const;
}
