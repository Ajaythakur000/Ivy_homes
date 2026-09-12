'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/proxy/v1/projects/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [params.id]);

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-secondary">Loading...</div>;
  if (!project) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-secondary">Project not found</div>;

  const priceMin = Math.min(project.price_min, project.price_max);
  const priceMax = Math.max(project.price_min, project.price_max);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="text-sm text-secondary mb-6">
        <Link href="/projects" className="hover:text-primary">Projects</Link> / <span>{project.apartment_name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">{project.apartment_name}</h1>
          <p className="text-secondary mt-1">by {project.developer_name} · <span className="capitalize">{project.locality}</span>, Pune</p>
        </div>
        <div className="text-right">
          <span className={`text-xs px-3 py-1 rounded-full ${
            project.project_status === 'completed' ? 'bg-green-50 text-green-700' :
            project.project_status === 'under construction' ? 'bg-yellow-50 text-yellow-700' :
            'bg-blue-50 text-blue-700'
          } capitalize`}>{project.project_status}</span>
        </div>
      </div>

      <div className="p-6 bg-white border border-border rounded-xl mb-8">
        <div className="text-2xl font-semibold mb-1">₹{priceMin} L – ₹{priceMax} L</div>
        <p className="text-sm text-secondary">Price range (in Lakhs). Note: project prices use mixed units.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Units', value: project.total_units },
          { label: 'Towers', value: project.total_towers },
          { label: 'Floors', value: project.total_floors },
          { label: 'Area Range', value: `${project.min_area_sqft}-${project.max_area_sqft} sqft` },
          { label: 'RERA', value: project.rera_number || 'N/A' },
          { label: 'Launch Date', value: project.launch_date || 'N/A' },
          { label: 'Possession', value: project.possession_date || 'N/A' },
          { label: 'Listings', value: project.total_listings },
        ].map((item, i) => (
          <div key={i} className="p-4 border border-border rounded-xl bg-white">
            <div className="text-xs text-secondary uppercase tracking-wide">{item.label}</div>
            <div className="font-semibold mt-1">{item.value}</div>
          </div>
        ))}
      </div>

      {project.amenities && project.amenities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-3">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {project.amenities.map((a: string, i: number) => (
              <span key={i} className="px-3 py-1.5 bg-[#F7F6F2] border border-border rounded-lg text-sm capitalize">{a}</span>
            ))}
          </div>
        </div>
      )}

      {project.project_url && (
        <a href={project.project_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl hover:bg-white transition text-sm">
          View Project Page ↗
        </a>
      )}
    </div>
  );
}
