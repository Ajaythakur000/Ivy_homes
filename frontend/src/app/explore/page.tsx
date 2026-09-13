'use client'
import { useState, useEffect } from 'react';
import { fetchListings } from '@/lib/api';
import { useFavourites } from '@/lib/FavouritesContext';
import Link from 'next/link';

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
      if (debouncedMinPrice !== minPrice || debouncedMaxPrice !== maxPrice) {
        setDebouncedMinPrice(minPrice);
        setDebouncedMaxPrice(maxPrice);
        resetAndReload();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [minPrice, maxPrice, debouncedMinPrice, debouncedMaxPrice]);

  useEffect(() => {
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
        const results = data.results || [];
        setListings(prev => offset === 0 ? results : [...prev, ...results]);
        setHasMore(data.has_more ?? false);
        setTotal(data.total ?? 0);
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
          <select
            value={sortBy ? `${sortBy}-${sortOrder}` : ''}
            onChange={e => {
              const [s, o] = e.target.value.split('-');
              setSortBy(s || ''); setSortOrder(o || 'desc');
              resetAndReload();
            }}
            className="border border-border rounded-lg px-3 py-2 bg-white text-sm"
          >
            <option value="">Default Order</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="posted_at-desc">Newest First</option>
            <option value="posted_at-asc">Oldest First</option>
          </select>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 bg-white border border-border rounded-xl">
        <select 
          value={locality} 
          onChange={e => { setLocality(e.target.value); resetAndReload(); }}
          className="border border-border rounded-lg px-3 py-2 bg-[#F7F6F2] text-sm"
        >
          <option value="">All Localities</option>
          <option value="hadapsar">Hadapsar</option>
          <option value="wakad">Wakad</option>
          <option value="hinjewadi">Hinjewadi</option>
          <option value="aundh">Aundh</option>
          <option value="kothrud">Kothrud</option>
          <option value="magarpatta">Magarpatta</option>
          <option value="baner">Baner</option>
          <option value="kharadi">Kharadi</option>
          <option value="viman nagar">Viman Nagar</option>
          <option value="balewadi">Balewadi</option>
        </select>

        <select 
          value={bhk} 
          onChange={e => { setBhk(e.target.value); resetAndReload(); }}
          className="border border-border rounded-lg px-3 py-2 bg-[#F7F6F2] text-sm"
        >
          <option value="">All BHK</option>
          <option value="1">1 BHK</option>
          <option value="2">2 BHK</option>
          <option value="3">3 BHK</option>
          <option value="4">4 BHK</option>
          <option value="5">5 BHK</option>
        </select>

        <select 
          value={propertyType} 
          onChange={e => { setPropertyType(e.target.value); resetAndReload(); }}
          className="border border-border rounded-lg px-3 py-2 bg-[#F7F6F2] text-sm"
        >
          <option value="">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="builder floor">Builder Floor</option>
          <option value="penthouse">Penthouse</option>
        </select>

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
          className="border border-border rounded-lg px-3 py-2 bg-[#F7F6F2] w-32 text-sm"
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
          className="border border-border rounded-lg px-3 py-2 bg-[#F7F6F2] w-32 text-sm"
        />
        <select 
          value={furnishing} 
          onChange={e => { setFurnishing(e.target.value); resetAndReload(); }}
          className="border border-border rounded-lg px-3 py-2 bg-[#F7F6F2] text-sm"
        >
          <option value="">Any Furnishing</option>
          <option value="fully-furnished">Fully Furnished</option>
          <option value="semi-furnished">Semi Furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </select>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {listings?.map(item => {
          const isSaved = favourites.isSaved(item.listing_id);
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
                  {item.is_verified && !hasError && (
                    <span className="bg-[#E8F3EE] text-accent text-xs px-2.5 py-1 rounded-md font-medium border border-[#D1E6DB] shadow-sm z-10">✓ Verified</span>
                  )}
                </div>

                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    favourites.toggleSavedItem(item.listing_id);
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-full z-10 transition-all shadow-sm border ${
                    isSaved 
                      ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100' 
                      : 'bg-white text-secondary border-border hover:text-accent hover:border-accent'
                  }`}
                  aria-label={isSaved ? "Remove from saved" : "Save property"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                
                <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
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
            className="px-8 py-2.5 border border-border rounded-xl hover:bg-white transition text-sm font-medium"
          >
            Load More Properties
          </button>
        </div>
      )}
    </div>
  );
}
