import { useEffect, useState } from "react";
import { db } from '@/components/firebase'
import { collection, getDocs } from 'firebase/firestore'
import type { MenuItem } from '@/components/types'

export function useRealtimeCollection(collectionName: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Set a timeout to stop loading after 3 seconds
        timeoutId = setTimeout(() => {
          setLoading(false);
          setError('Timeout - utilisation des données locales');
        }, 3000);
        
        const snapshot = await getDocs(collection(db, collectionName));
        clearTimeout(timeoutId);
        
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
          } as MenuItem;
        });
        setItems(docs);
        setLoading(false);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error(err);
        setError("Erreur de chargement - utilisation des données locales");
        setLoading(false);
      }
    }
    
    fetchData();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [collectionName]);

  return { items, loading, error } as const;
}


