'use client'
import { useState, useEffect } from 'react';
import { getSaved, toggleSaved } from '@/lib/api';
import Link from 'next/link';

function formatPrice(price: number) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price?.toLocaleString('en-IN')}`;
}

export default function FavouritesPage() {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSaved(); }, []);

  async function loadSaved() {
    setLoading(true);
    try {
      const data = await getSaved();
      setSavedItems(data.results || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleRemove(id: string, e: React.MouseEvent) {
    e.preventDefault();
    try {
      await toggleSaved(id, true);
      setSavedItems(prev => prev.filter(item => item.listing_id !== id));
    } catch (err) { console.error(err); }
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
