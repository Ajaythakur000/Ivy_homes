'use client'
import { useState, useEffect } from 'react';
import { fetchListings } from '@/lib/api';
import Link from 'next/link';

function formatPrice(price: number) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function ExplorePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params: Record<string, any> = { offset, limit };
        if (locality) params.locality = locality;
        if (bhk) params.bhk = bhk;
        if (propertyType) params.property_type = propertyType;
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
  }, [locality, bhk, propertyType, sortBy, sortOrder, offset]);

  // Client-side filtering for broken API filters
  const filteredListings = listings.filter(item => {
    const price = item.price;
    if (price < 0) return false; // corrupt
    if (minPrice && price < Number(minPrice) * 100000) return false;
    if (maxPrice && price > Number(maxPrice) * 100000) return false;
    if (furnishing && item.furnishing?.toLowerCase() !== furnishing.toLowerCase()) return false;
    return true;
  });

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

        {/* Client-side filters (API ignores these) */}
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
          onChange={e => {
            const val = e.target.value;
            if (val === '' || Number(val) >= 0) {
              // Only accept if empty or >= minPrice
              if (val === '' || !minPrice || Number(val) >= Number(minPrice)) {
                setMaxPrice(val);
              }
            }
          }}
          onWheel={e => (e.target as HTMLInputElement).blur()}
          className={`border rounded-lg px-3 py-2 bg-[#F7F6F2] w-32 text-sm ${
            maxPrice && minPrice && Number(maxPrice) < Number(minPrice)
              ? 'border-red-400' : 'border-border'
          }`}
        />
        <select 
          value={furnishing} 
          onChange={e => setFurnishing(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 bg-[#F7F6F2] text-sm"
        >
          <option value="">Any Furnishing</option>
          <option value="fully-furnished">Fully Furnished</option>
          <option value="semi-furnished">Semi Furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </select>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredListings.map(item => (
          <Link key={item.listing_id} href={`/listing/${item.listing_id}`} className="group block border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white">
            <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
              <span className="text-muted text-sm">{item.property_type}</span>
              {item.is_live === false && (
                <span className="absolute top-3 right-3 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Inactive</span>
              )}
              {item.is_verified && (
                <span className="absolute top-3 left-3 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓ Verified</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-base truncate group-hover:text-accent transition-colors">{item.apartment_name || 'Unnamed'}</h3>
              <p className="text-secondary text-sm capitalize">{item.locality}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-lg">{formatPrice(item.price)}</span>
                <span className="text-sm text-secondary">{item.bedroom} BHK · {item.carpet_area} sqft</span>
              </div>
              <div className="mt-2 flex gap-2">
                <span className="text-xs text-muted bg-[#F7F6F2] px-2 py-0.5 rounded">{item.furnishing}</span>
                <span className="text-xs text-muted bg-[#F7F6F2] px-2 py-0.5 rounded">{item.facing_direction}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {loading && <div className="text-center py-8 text-secondary">Loading properties...</div>}
      
      {!loading && filteredListings.length === 0 && (
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
