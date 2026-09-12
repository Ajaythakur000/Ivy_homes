'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getSaved, saveListing, unsaveListing } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface FavouritesState {
  savedIds: Set<string>;
  loading: boolean;
  isSaved: (id: string) => boolean;
  toggleSavedItem: (id: string) => Promise<void>;
}

const FavouritesContext = createContext<FavouritesState>({
  savedIds: new Set(),
  loading: true,
  isSaved: () => false,
  toggleSavedItem: async () => {},
});

export function useFavourites() {
  return useContext(FavouritesContext);
}

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const loadSaved = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedIds(new Set());
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getSaved();
      const ids = new Set<string>((data.results || []).map((r: any) => r.listing_id));
      setSavedIds(ids);
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
    
    // Optimistic update
    setSavedIds(prev => {
      const next = new Set(prev);
      if (currentlySaved) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    try {
      if (currentlySaved) {
        await unsaveListing(id);
      } else {
        await saveListing(id);
      }
    } catch (err) {
      console.error('Failed to toggle saved item', err);
      // Revert optimistic update on failure
      setSavedIds(prev => {
        const next = new Set(prev);
        if (currentlySaved) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    }
  }, [savedIds]);

  return (
    <FavouritesContext.Provider value={{ savedIds, loading, isSaved, toggleSavedItem }}>
      {children}
    </FavouritesContext.Provider>
  );
}
