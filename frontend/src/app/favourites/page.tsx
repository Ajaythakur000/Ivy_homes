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
  const { savedIds, savedItems: contextSavedItems, loading: favLoading, toggleSavedItem } = useFavourites();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Derive display items from context so we don't fetch independently
  const savedItems = contextSavedItems.filter(item => savedIds.has(item.listing_id));

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
    <div className="page-container py-12 md:py-16">
      <h1 className="heading-section mb-12">Saved Properties</h1>
      
      {favLoading ? (
        <div className="py-24 flex justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/[0.05]"></div>
            <div className="w-32 h-4 rounded bg-white/[0.05]"></div>
          </div>
        </div>
      ) : savedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 bg-[#15181E] border border-white/[0.08] rounded-full flex items-center justify-center mb-6 shadow-inner shadow-black/20">
            <svg className="w-8 h-8 text-secondary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">No saved properties yet</h2>
          <p className="text-secondary max-w-md mx-auto mb-8">
            Properties you heart will appear here so you can easily compare and revisit them later.
          </p>
          <Link href="/explore" className="btn-primary inline-flex items-center gap-2">
            Browse listings
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {savedItems.map(item => {
            const hasError = item.price < 0 || !item.apartment_name;
            return (
              <div key={item.listing_id} className="group relative flex flex-col border border-white/[0.08] rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-white/[0.15] hover:-translate-y-1 transition-all duration-300 bg-[#15181E]">
                <Link href={`/listing/${item.listing_id}`} className="absolute inset-0 z-0" aria-label={`View ${item.apartment_name}`} />
                
                <div 
                  className="h-52 relative flex items-center justify-center border-b border-white/[0.08] shadow-inner shadow-black/20"
                  style={{
                    backgroundColor: '#1A1D24',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23686863' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`
                  }}
                >
                  <span className="text-muted text-xs uppercase tracking-widest font-medium px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
                    {item.property_type || 'Property'}
                  </span>
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    {hasError && (
                      <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-md font-medium border border-red-500/20 shadow-sm z-10">⚠ Invalid</span>
                    )}
                    {item.is_live === false && !hasError && (
                      <span className="bg-white/5 text-secondary text-xs px-2.5 py-1 rounded-md font-medium border border-white/10 shadow-sm z-10">Inactive</span>
                    )}
                  </div>

                  <button 
                    onClick={(e) => handleRemove(item.listing_id, e)}
                    className="absolute top-3 right-3 p-2 rounded-full z-10 transition-all shadow-sm border bg-[#0F1115]/80 backdrop-blur-md text-red-400 border-red-500/30 hover:bg-red-500/20 hover:scale-105"
                    title="Remove from saved"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="p-5 flex flex-col flex-grow z-10 pointer-events-none">
                  <h3 className="font-semibold text-[1.15rem] leading-tight truncate group-hover:text-accent transition-colors text-foreground">{item.apartment_name || 'Unnamed Property'}</h3>
                  <p className="text-secondary text-sm mt-1 capitalize">{item.locality || 'Unknown location'}</p>
                  
                  <div className="mt-4 flex items-end justify-between">
                    <span className="font-bold text-xl tracking-tight text-white">{item.price >= 0 ? formatPrice(item.price) : 'N/A'}</span>
                    <span className="text-sm font-medium text-muted tracking-wide">{item.bedroom} BHK <span className="mx-1 opacity-50">|</span> {item.carpet_area} sqft</span>
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
