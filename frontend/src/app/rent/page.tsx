'use client'
import { useState, useEffect } from 'react';
import { fetchRentals } from '@/lib/api';
import Link from 'next/link';

export default function RentPage() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [locality, setLocality] = useState('');
  const [bhk, setBhk] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 24;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params: Record<string, any> = { offset, limit };
        if (locality) params.locality = locality;
        if (bhk) params.bhk = bhk;
        const data = await fetchRentals(params);
        setRentals(prev => offset === 0 ? (data.results || []) : [...prev, ...(data.results || [])]);
        setHasMore(data.has_more ?? false);
        setTotal(data.total ?? 0);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadData();
  }, [locality, bhk, offset]);

  const reset = () => { setOffset(0); setRentals([]); };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Rental Properties</h1>
        <p className="text-secondary mt-1">{total.toLocaleString()} rentals in Pune</p>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-8 p-4 bg-white border border-border rounded-xl">
        <select value={locality} onChange={e => { setLocality(e.target.value); reset(); }}
          className="border border-border rounded-lg px-3 py-2 bg-[#F7F6F2] text-sm">
          <option value="">All Localities</option>
          {['hadapsar','wakad','hinjewadi','aundh','kothrud','magarpatta','baner','kharadi','viman nagar','balewadi'].map(l => (
            <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
          ))}
        </select>
        <select value={bhk} onChange={e => { setBhk(e.target.value); reset(); }}
          className="border border-border rounded-lg px-3 py-2 bg-[#F7F6F2] text-sm">
          <option value="">All BHK</option>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} BHK</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {rentals.map(item => (
          <Link key={item.listing_id} href={`/rental/${item.listing_id}`} className="group block border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white">
            <div className="h-40 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
              <span className="text-muted text-sm capitalize">{item.property_type}</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold truncate group-hover:text-accent transition-colors">{item.title || item.apartment_name || 'Unnamed'}</h3>
              <p className="text-secondary text-sm capitalize">{item.locality}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-lg">₹{item.price?.toLocaleString('en-IN')}<span className="text-sm font-normal text-secondary">/mo</span></span>
                <span className="text-sm text-secondary">{item.bedroom} BHK</span>
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="text-muted bg-[#F7F6F2] px-2 py-0.5 rounded capitalize">{item.furnishing}</span>
                {item.deposit > 0 && <span className="text-muted bg-[#F7F6F2] px-2 py-0.5 rounded">Dep: ₹{item.deposit?.toLocaleString('en-IN')}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {loading && <div className="text-center py-8 text-secondary">Loading...</div>}
      {!loading && hasMore && (
        <div className="text-center py-4">
          <button onClick={() => setOffset(prev => prev + limit)} className="px-8 py-2.5 border border-border rounded-xl hover:bg-white transition text-sm font-medium">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
