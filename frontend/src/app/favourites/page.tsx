'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useFavourites } from '@/lib/FavouritesContext';
import Link from 'next/link';

function formatPrice(price: number) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price?.toLocaleString('en-IN')}`;
}

export default function FavouritesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { savedIds, loading: favLoading, toggleSavedItem } = useFavourites();
  const router = useRouter();
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (savedIds.size === 0) {
      setSavedItems([]);
      return;
    }
    
    // Fetch details for all saved IDs
    async function fetchSavedDetails() {
      setFetching(true);
      try {
        let allSaved: any[] = [];
        let currentOffset = 0;
        let hasMore = true;
        
        while (hasMore) {
          const res = await fetch(`/api/proxy/v1/saved?offset=${currentOffset}&limit=50`);
          if (!res.ok) break;
          const data = await res.json();
          allSaved = allSaved.concat(data.results || []);
          if (!data.has_more) break;
          currentOffset += 50;
        }
        
        // Filter to only what's currently in context to prevent sync lag
        const items = allSaved.filter((r: any) => savedIds.has(r.listing_id));
        setSavedItems(items);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    fetchSavedDetails();
  }, [savedIds]);

  async function handleRemove(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleSavedItem(id);
  }

  // Show nothing while redirecting
  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-8">Saved Properties</h1>
      
      {favLoading || fetching ? (
        <p className="text-secondary py-12 text-center">Loading saved properties...</p>
      ) : savedItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-secondary text-lg">No saved properties yet</p>
          <Link href="/explore" className="text-accent hover:underline mt-2 inline-block">Browse listings →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {savedItems.map(item => {
            const hasError = item.price < 0 || !item.apartment_name;
            return (
              <div key={item.listing_id} className="group relative flex flex-col border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white">
                <Link href={`/listing/${item.listing_id}`} className="absolute inset-0 z-0" aria-label={`View ${item.apartment_name}`} />
                
                <div 
                  className="h-48 relative flex items-center justify-center border-b border-border/50"
                  style={{
                    backgroundColor: '#F7F6F2',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23686863' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`
                  }}
                >
                  <span className="text-muted text-xs uppercase tracking-widest font-medium px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-border/50">
                    {item.property_type || 'Property'}
                  </span>
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    {hasError && (
                      <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-md font-medium border border-red-200 shadow-sm z-10">⚠ Invalid</span>
                    )}
                    {item.is_live === false && !hasError && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md font-medium border border-gray-200 shadow-sm z-10">Inactive</span>
                    )}
                  </div>

                  <button 
                    onClick={(e) => handleRemove(item.listing_id, e)}
                    className="absolute top-3 right-3 p-2 rounded-full z-10 transition-all shadow-sm border bg-red-50 text-red-500 border-red-100 hover:bg-red-100"
                    title="Remove from saved"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="p-5 flex flex-col flex-grow z-10 pointer-events-none">
                  <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-accent transition-colors">{item.apartment_name || 'Unnamed Property'}</h3>
                  <p className="text-secondary text-sm mt-1 capitalize">{item.locality || 'Unknown location'}</p>
                  
                  <div className="mt-4 flex items-end justify-between">
                    <span className="font-semibold text-xl tracking-tight">{item.price >= 0 ? formatPrice(item.price) : 'N/A'}</span>
                    <span className="text-sm font-medium text-secondary">{item.bedroom} BHK <span className="mx-1 opacity-50">|</span> {item.carpet_area} sqft</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
