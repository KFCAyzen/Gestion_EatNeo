import { useEffect, useState } from "react";
import { db } from '@/components/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import type { MenuItem } from '@/components/types'

export function useRealtimeCollection(collectionName: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`Setting up listener for collection: ${collectionName}`);
    
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        console.log(`Received ${snapshot.docs.length} documents from ${collectionName}`);
        
        const docs = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            nom: data.nom ?? "",
            description: data.description ?? "",
            prix: data.prix,
            image: data.image ?? "",
            catégorie: Array.isArray(data.catégorie) ? data.catégorie : [],
            filtre: Array.isArray(data.filtre) ? data.filtre : [],
            masque: data.masque ?? false,
            stock: data.stock ?? 0,
          } as MenuItem;
        });
        
        setItems(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error listening to ${collectionName}:`, err);
        setError(`Erreur de chargement: ${err.message}`);
        setLoading(false);
      }
    );
    
    return () => {
      console.log(`Cleaning up listener for ${collectionName}`);
      unsubscribe();
    };
  }, [collectionName]);

  return { items, loading, error } as const;
}


