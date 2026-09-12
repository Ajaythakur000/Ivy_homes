'use client'
import { useState, useEffect } from 'react';
import { getSaved, toggleSaved } from '@/lib/api';
import Link from 'next/link';

export default function FavouritesPage() {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaved();
  }, []);

  async function loadSaved() {
    setLoading(true);
    try {
      const data = await getSaved();
      setSavedItems(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id: string, e: React.MouseEvent) {
    e.preventDefault();
    try {
      await toggleSaved(id, true); // true means it is saved, so we toggle it to remove
      setSavedItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to remove saved item', err);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-8">Saved Properties</h1>
      
      {loading ? (
        <p>Loading your saved properties...</p>
      ) : savedItems.length === 0 ? (
        <p className="text-secondary">You haven't saved any properties yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map(item => (
            <Link key={item.id} href={`/listing/${item.id}`} className="block border border-border rounded-lg overflow-hidden hover:shadow-md transition bg-white relative">
              <button 
                onClick={(e) => handleRemove(item.id, e)}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-sm hover:bg-gray-100 z-10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-secondary">No image</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg truncate">{item.name || 'Unnamed Property'}</h3>
                <p className="text-secondary text-sm">{item.locality}</p>
                <div className="mt-2 font-medium flex justify-between">
                  <span>₹{item.price_min} Lakhs</span>
                  <span className="text-sm text-secondary">{item.bhk} BHK</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
