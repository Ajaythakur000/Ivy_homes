'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getSaved, saveListing, unsaveListing } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface FavouritesState {
  savedIds: Set<string>;
  savedItems: any[];
  loading: boolean;
  isSaved: (id: string) => boolean;
  toggleSavedItem: (id: string) => Promise<void>;
}

const FavouritesContext = createContext<FavouritesState>({
  savedIds: new Set(),
  savedItems: [],
  loading: true,
  isSaved: () => false,
  toggleSavedItem: async () => {},
});

export function useFavourites() {
  return useContext(FavouritesContext);
}

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const loadSaved = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedIds(new Set());
      setSavedItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let allSaved: any[] = [];
      let currentOffset = 0;
      let hasMore = true;
      
      while (hasMore) {
        const data = await getSaved({ offset: currentOffset, limit: 50 });
        allSaved = allSaved.concat(data.results || []);
        if (!data.has_more) break;
        currentOffset += 50;
      }
      
      const ids = new Set<string>(allSaved.map((r: any) => r.listing_id));
      setSavedIds(ids);
      setSavedItems(allSaved);
    } catch (err) {
      console.error('Failed to load favourites', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const isSaved = useCallback((id: string) => {
    return savedIds.has(id);
  }, [savedIds]);

  const toggleSavedItem = useCallback(async (id: string) => {
    const currentlySaved = savedIds.has(id);
    
    try {
      if (currentlySaved) {
        await unsaveListing(id);
        setSavedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        await saveListing(id);
        setSavedIds(prev => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to toggle saved item', err);
    }
  }, [savedIds]);

  return (
    <FavouritesContext.Provider value={{ savedIds, savedItems, loading, isSaved, toggleSavedItem }}>
      {children}
    </FavouritesContext.Provider>
  );
}
