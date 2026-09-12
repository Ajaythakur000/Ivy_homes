'use client'
import { useState, useEffect } from 'react';
import { fetchListings } from '@/lib/api';
import Link from 'next/link';

export default function ExplorePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // API filters
  const [locality, setLocality] = useState('');
  const [bhk, setBhk] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  // Client-side filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [furnishing, setFurnishing] = useState('');
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchListings({ 
          city_id: 3, 
          locality,
          bhk,
          property_type: 'buy',
          offset,
          limit
        });
        setListings(prev => offset === 0 ? (data.results || []) : [...prev, ...(data.results || [])]);
        setHasMore(data.has_more);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [locality, bhk, offset]);

  const filteredListings = listings.filter(item => {
    let price = Number(item.price_min);
    if (minPrice && price < Number(minPrice)) return false;
    if (maxPrice && price > Number(maxPrice)) return false;
    if (furnishing && item.furnishing?.toLowerCase() !== furnishing.toLowerCase()) return false;
    // Filter corrupt prices (negative)
    if (price < 0) return false;
    return true;
  });

  const handleFilterChange = () => {
    setOffset(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-8">Explore Properties</h1>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <select 
          value={locality} 
          onChange={e => { setLocality(e.target.value); handleFilterChange(); }}
          className="border border-border rounded-md px-3 py-2 bg-white"
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
          onChange={e => { setBhk(e.target.value); handleFilterChange(); }}
          className="border border-border rounded-md px-3 py-2 bg-white"
        >
          <option value="">All BHK</option>
          <option value="1">1 BHK</option>
          <option value="2">2 BHK</option>
          <option value="3">3 BHK</option>
          <option value="4">4 BHK</option>
        </select>

        {/* Client side filters */}
        <input 
          type="number"
          placeholder="Min Price (Lakhs)"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          className="border border-border rounded-md px-3 py-2 bg-white w-36"
        />
        <input 
          type="number"
          placeholder="Max Price (Lakhs)"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          className="border border-border rounded-md px-3 py-2 bg-white w-36"
        />
        <select 
          value={furnishing} 
          onChange={e => setFurnishing(e.target.value)}
          className="border border-border rounded-md px-3 py-2 bg-white"
        >
          <option value="">Any Furnishing</option>
          <option value="furnished">Furnished</option>
          <option value="semi-furnished">Semi-Furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredListings.map(item => (
          <Link key={item.id} href={`/listing/${item.id}`} className="block border border-border rounded-lg overflow-hidden hover:shadow-md transition bg-white">
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
      
      {loading && <div className="text-center py-4">Loading more...</div>}
      
      {!loading && hasMore && (
        <div className="text-center">
          <button 
            onClick={() => setOffset(prev => prev + limit)}
            className="px-6 py-2 border border-border rounded-md hover:bg-gray-50 transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
