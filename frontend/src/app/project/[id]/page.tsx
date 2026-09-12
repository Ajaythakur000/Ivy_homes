'use client'
import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetchApi(`/v1/projects/${params.id}`);
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

  if (loading) return <div className="p-8">Loading...</div>;
  if (!project) return <div className="p-8">Project not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-2">{project.name || 'Unnamed Project'}</h1>
      <p className="text-secondary mb-6">{project.locality} • By {project.developer_name}</p>
      
      <div className="aspect-video bg-gray-200 rounded-lg mb-8 overflow-hidden">
        {project.images?.[0] ? (
          <img src={project.images[0]} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary">No image available</div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 border border-border rounded-lg bg-white">
          <div className="text-sm text-secondary">Price Range</div>
          <div className="font-semibold">₹{project.price_min} - {project.price_max} L</div>
        </div>
        <div className="p-4 border border-border rounded-lg bg-white">
          <div className="text-sm text-secondary">Status</div>
          <div className="font-semibold capitalize">{project.status || 'N/A'}</div>
        </div>
        <div className="p-4 border border-border rounded-lg bg-white">
          <div className="text-sm text-secondary">Possession</div>
          <div className="font-semibold">{project.possession_date || 'N/A'}</div>
        </div>
        <div className="p-4 border border-border rounded-lg bg-white">
          <div className="text-sm text-secondary">Configurations</div>
          <div className="font-semibold">{project.configurations?.join(', ') || 'N/A'}</div>
        </div>
      </div>
      
      <div className="prose">
        <h3 className="text-xl font-medium mb-2">Description</h3>
        <p className="text-secondary leading-relaxed">{project.description || 'No description available.'}</p>
      </div>
    </div>
  );
}
