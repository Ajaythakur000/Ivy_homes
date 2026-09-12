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
        // We fetch the full list of saved from the proxy to get all metadata
        const res = await fetch('/api/proxy/v1/saved');
        if (res.ok) {
          const data = await res.json();
          // Filter to only what's currently in context to prevent sync lag
          const items = (data.results || []).filter((r: any) => savedIds.has(r.listing_id));
          setSavedItems(items);
        }
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
    toggleSavedItem(id);
  }

  // Show nothing while redirecting
  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-8">Saved Properties</h1>
      
      {loading ? (
        <p className="text-secondary py-12 text-center">Loading saved properties...</p>
      ) : savedItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-secondary text-lg">No saved properties yet</p>
          <Link href="/explore" className="text-accent hover:underline mt-2 inline-block">Browse listings →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map(item => (
            <Link key={item.listing_id} href={`/listing/${item.listing_id}`} className="group block border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white relative">
              <button 
                onClick={(e) => handleRemove(item.listing_id, e)}
                className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-sm hover:bg-red-50 z-10 transition"
                title="Remove from saved"
              >
                <span className="text-red-500">♥</span>
              </button>
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-muted text-sm capitalize">{item.property_type}</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate group-hover:text-accent transition-colors">{item.apartment_name || 'Unnamed'}</h3>
                <p className="text-secondary text-sm capitalize">{item.locality}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold text-lg">{formatPrice(item.price)}</span>
                  <span className="text-sm text-secondary">{item.bedroom} BHK · {item.carpet_area} sqft</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
