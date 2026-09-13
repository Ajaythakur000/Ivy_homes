'use client'
import { useState, useEffect } from 'react';
import { fetchListings } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useFavourites } from '@/lib/FavouritesContext';
import Link from 'next/link';
import CustomSelect from '@/components/CustomSelect';

function formatPrice(price: number) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function ExplorePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const favourites = useFavourites();
  const [total, setTotal] = useState(0);
  
  // API filters (these work server-side)
  const [locality, setLocality] = useState('');
  const [bhk, setBhk] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 24;

  // Client-side filters (API ignores these)
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [furnishing, setFurnishing] = useState('');
  
  const [debouncedMinPrice, setDebouncedMinPrice] = useState('');
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('');

  // Debounce price filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      let changed = false;
      if (debouncedMinPrice !== minPrice) { setDebouncedMinPrice(minPrice); changed = true; }
      if (debouncedMaxPrice !== maxPrice) { setDebouncedMaxPrice(maxPrice); changed = true; }
      if (changed) resetAndReload();
    }, 500);
    return () => clearTimeout(timer);
  }, [minPrice, maxPrice, debouncedMinPrice, debouncedMaxPrice]);

  useEffect(() => {
    let ignore = false;
    
    async function loadData() {
      setLoading(true);
      try {
        const params: Record<string, any> = { offset, limit };
        if (locality) params.locality = locality;
        if (bhk) params.bhk = bhk;
        if (propertyType) params.property_type = propertyType;
        if (debouncedMinPrice) params.min_price = debouncedMinPrice;
        if (debouncedMaxPrice) params.max_price = debouncedMaxPrice;
        if (furnishing) params.furnishing = furnishing;
        if (sortBy) { params.sort_by = sortBy; params.order = sortOrder; }

        const data = await fetchListings(params);
        if (ignore) return;
        
        const results = data.results || [];
        setListings(prev => offset === 0 ? results : [...prev, ...results]);
        setHasMore(data.has_more ?? false);
        setTotal(data.total ?? 0);
      } catch (err) {
        if (!ignore) console.error('Failed to load listings:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    
    loadData();
    return () => { ignore = true; };
  }, [locality, bhk, propertyType, debouncedMinPrice, debouncedMaxPrice, furnishing, sortBy, sortOrder, offset]);

  const resetAndReload = () => {
    setOffset(0);
    setListings([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Explore Properties</h1>
          <p className="text-secondary mt-1">{total.toLocaleString()} properties in Pune</p>
        </div>
        <div className="flex items-center gap-3">
          <CustomSelect 
            value={sortBy ? `${sortBy}-${sortOrder}` : ''} 
            onChange={val => {
              const [s, o] = val.split('-');
              setSortBy(s || ''); setSortOrder(o || 'desc');
              resetAndReload();
            }}
            options={[
              { value: '', label: 'Default Order' },
              { value: 'price-asc', label: 'Price: Low to High' },
              { value: 'price-desc', label: 'Price: High to Low' },
              { value: 'posted_at-desc', label: 'Newest First' },
              { value: 'posted_at-asc', label: 'Oldest First' }
            ]}
            className="w-48"
          />
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 bg-surface border border-white/[0.08] rounded-xl">
        <CustomSelect
          value={locality}
          onChange={val => { setLocality(val); resetAndReload(); }}
          options={[
            { value: '', label: 'All Localities' },
            { value: 'hadapsar', label: 'Hadapsar' },
            { value: 'wakad', label: 'Wakad' },
            { value: 'hinjewadi', label: 'Hinjewadi' },
            { value: 'aundh', label: 'Aundh' },
            { value: 'kothrud', label: 'Kothrud' },
            { value: 'magarpatta', label: 'Magarpatta' },
            { value: 'baner', label: 'Baner' },
            { value: 'kharadi', label: 'Kharadi' },
            { value: 'viman nagar', label: 'Viman Nagar' },
            { value: 'balewadi', label: 'Balewadi' }
          ]}
        />

        <CustomSelect
          value={bhk}
          onChange={val => { setBhk(val); resetAndReload(); }}
          options={[
            { value: '', label: 'All BHK' },
            { value: '1', label: '1 BHK' },
            { value: '2', label: '2 BHK' },
            { value: '3', label: '3 BHK' },
            { value: '4', label: '4 BHK' },
            { value: '5', label: '5 BHK' }
          ]}
        />

        <CustomSelect
          value={propertyType}
          onChange={val => { setPropertyType(val); resetAndReload(); }}
          options={[
            { value: '', label: 'All Types' },
            { value: 'apartment', label: 'Apartment' },
            { value: 'villa', label: 'Villa' },
            { value: 'builder floor', label: 'Builder Floor' },
            { value: 'penthouse', label: 'Penthouse' }
          ]}
        />

        <input 
          type="number"
          min="0"
          placeholder="Min Price (L)"
          value={minPrice}
          onChange={e => {
            const val = e.target.value;
            if (val === '' || Number(val) >= 0) {
              setMinPrice(val);
              // If max is set and now less than min, clear max
              if (maxPrice && val && Number(maxPrice) < Number(val)) setMaxPrice('');
            }
          }}
          onWheel={e => (e.target as HTMLInputElement).blur()}
          className="border border-white/[0.08] rounded-lg px-3 py-2 bg-[#15181E] w-32 text-sm"
        />
        <input 
          type="number"
          min="0"
          placeholder="Max Price (L)"
          value={maxPrice}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || Number(val) >= 0) {
              setMaxPrice(val);
            }
          }}
          onWheel={e => (e.target as HTMLInputElement).blur()}
          className="border border-white/[0.08] rounded-lg px-3 py-2 bg-[#15181E] w-32 text-sm"
        />
        <CustomSelect
          value={furnishing}
          onChange={val => { setFurnishing(val); resetAndReload(); }}
          options={[
            { value: '', label: 'Any Furnishing' },
            { value: 'fully-furnished', label: 'Fully Furnished' },
            { value: 'semi-furnished', label: 'Semi Furnished' },
            { value: 'unfurnished', label: 'Unfurnished' }
          ]}
        />
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {listings?.map(item => {
          const isSaved = favourites.isSaved(item.listing_id);
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
                  {item.is_verified && !hasError && (
                    <span className="bg-[#E8F3EE] text-accent text-xs px-2.5 py-1 rounded-md font-medium border border-[#D1E6DB] shadow-sm z-10">✓ Verified</span>
                  )}
                </div>

                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    favourites.toggleSavedItem(item.listing_id, item);
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-full z-10 transition-all shadow-sm border ${
                    isSaved 
                      ? 'bg-[#0F1115]/80 backdrop-blur-md text-red-400 border-red-500/30 hover:bg-red-500/20 hover:scale-105' 
                      : 'bg-[#0F1115]/80 backdrop-blur-md text-secondary border-white/[0.15] hover:text-accent hover:border-accent hover:scale-105'
                  }`}
                  aria-label={isSaved ? "Remove from saved" : "Save property"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                
                <div className="mt-4 pt-4 border-t border-white/[0.08]/50 flex gap-2">
                  <span className="text-[11px] font-medium text-secondary uppercase tracking-wider bg-background px-2 py-1 rounded-md">{item.furnishing || 'N/A'}</span>
                  <span className="text-[11px] font-medium text-secondary uppercase tracking-wider bg-background px-2 py-1 rounded-md">{item.facing_direction || 'N/A'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {loading && <div className="text-center py-8 text-secondary">Loading properties...</div>}
      
      {!loading && listings.length === 0 && (
        <div className="text-center py-12 text-secondary">
          <p className="text-lg">No properties match your filters</p>
          <p className="text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}
      
      {!loading && hasMore && (
        <div className="text-center py-4">
          <button 
            onClick={() => setOffset(prev => prev + limit)}
            className="btn-secondary text-sm font-medium"
          >
            Load More Properties
          </button>
        </div>
      )}
    </div>
  );
}
