'use client'
import { useState, useEffect } from 'react';
import { fetchProjects } from '@/lib/api';
import Link from 'next/link';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [locality, setLocality] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchProjects({ 
          city_id: 3, 
          locality,
          offset,
          limit
        });
        setProjects(prev => offset === 0 ? (data.results || []) : [...prev, ...(data.results || [])]);
        setHasMore(data.has_more);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [locality, offset]);

  const handleFilterChange = () => {
    setOffset(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-8">Premium Projects</h1>
      
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
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {projects.map(item => (
          <Link key={item.id} href={`/project/${item.id}`} className="block border border-border rounded-lg overflow-hidden hover:shadow-md transition bg-white">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-secondary">No image</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg truncate">{item.name || 'Unnamed Project'}</h3>
              <p className="text-secondary text-sm">{item.locality}</p>
              <div className="mt-2 font-medium">₹{item.price_min} Lakhs - ₹{item.price_max} Lakhs</div>
              <div className="text-sm text-secondary mt-1">{item.developer_name}</div>
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
