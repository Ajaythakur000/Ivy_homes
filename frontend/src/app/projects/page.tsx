'use client'
import { useState, useEffect } from 'react';
import { fetchProjects } from '@/lib/api';
import Link from 'next/link';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [locality, setLocality] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 24;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params: Record<string, any> = { offset, limit };
        if (locality) params.locality = locality;
        const data = await fetchProjects(params);
        setProjects(prev => offset === 0 ? (data.results || []) : [...prev, ...(data.results || [])]);
        setHasMore(data.has_more ?? false);
        setTotal(data.total ?? 0);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadData();
  }, [locality, offset]);

  const reset = () => { setOffset(0); setProjects([]); };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Projects</h1>
        <p className="text-secondary mt-1">{total.toLocaleString()} projects in Pune</p>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-8">
        <select value={locality} onChange={e => { setLocality(e.target.value); reset(); }}
          className="border border-white/[0.08] rounded-lg px-3 py-2 bg-surface text-foreground text-sm">
          <option value="">All Localities</option>
          {['hadapsar','wakad','hinjewadi','aundh','kothrud','magarpatta','baner','kharadi','viman nagar','balewadi'].map(l => (
            <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {projects.map(item => (
          <Link key={item.project_id} href={`/project/${item.project_id}`} className="group block border border-white/[0.08] rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-white/[0.15] hover:-translate-y-1 transition-all duration-300 bg-[#15181E]">
              <div className="h-48 relative flex items-center justify-center bg-gradient-to-br from-[#1A1D24] to-[#0F1115] border-b border-white/[0.08] shadow-inner shadow-black/20">
                <span className="text-muted text-sm capitalize">{item.project_status}</span>
              </div>
            <div className="p-4">
              <h3 className="font-semibold truncate group-hover:text-accent transition-colors">{item.apartment_name}</h3>
              <p className="text-secondary text-sm capitalize">{item.locality} · {item.developer_name}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold">₹{Math.min(item.price_min, item.price_max)} - {Math.max(item.price_min, item.price_max)} L</span>
              </div>
              <div className="mt-2 flex gap-2 text-xs flex-wrap">
                <span className="text-muted bg-[#15181E] px-2 py-0.5 rounded">{item.total_units} units</span>
                <span className="text-muted bg-[#15181E] px-2 py-0.5 rounded">{item.total_towers} towers</span>
                <span className="text-muted bg-[#15181E] px-2 py-0.5 rounded">{item.min_area_sqft}-{item.max_area_sqft} sqft</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {loading && <div className="text-center py-8 text-secondary">Loading...</div>}
      {!loading && hasMore && (
        <div className="text-center py-4">
          <button onClick={() => setOffset(prev => prev + limit)} className="btn-secondary text-sm font-medium">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
