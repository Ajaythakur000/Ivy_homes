'use client'
import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';

export default function RentalDetail({ params }: { params: { id: string } }) {
  const [rental, setRental] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi(`/v1/rentals/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setRental)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-secondary">Loading...</div>;
  if (!rental) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-secondary">Rental not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="text-sm text-secondary mb-6">
        <Link href="/rent" className="hover:text-primary">Rentals</Link> / <span className="capitalize">{rental.locality}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">{rental.title || rental.apartment_name}</h1>
          <p className="text-secondary mt-1 capitalize">{rental.locality}, Pune</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold">₹{rental.price?.toLocaleString('en-IN')}<span className="text-base font-normal text-secondary">/mo</span></p>
          {rental.deposit > 0 && <p className="text-sm text-secondary mt-1">Deposit: ₹{rental.deposit?.toLocaleString('en-IN')}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Bedrooms', value: `${rental.bedroom} BHK` },
          { label: 'Bathrooms', value: rental.bathroom },
          { label: 'Carpet Area', value: `${rental.carpet_area} sqft` },
          { label: 'Furnishing', value: rental.furnishing },
          { label: 'Floor', value: `${rental.floor} / ${rental.total_floors}` },
          { label: 'Facing', value: rental.facing_direction },
          { label: 'Maintenance', value: rental.maintenance ? `₹${rental.maintenance}/mo` : 'N/A' },
          { label: 'Type', value: rental.property_type },
        ].map((item, i) => (
          <div key={i} className="p-4 border border-border rounded-xl bg-white">
            <div className="text-xs text-secondary uppercase tracking-wide">{item.label}</div>
            <div className="font-semibold mt-1 capitalize">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-medium mb-3">Description</h2>
        <p className="text-secondary leading-relaxed">{rental.description || 'No description.'}</p>
      </div>

      <div className="p-5 border border-border rounded-xl bg-white mb-8">
        <h3 className="font-medium mb-3">Contact</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-secondary">Posted by</span><span className="capitalize">{rental.posted_by}</span></div>
          <div className="flex justify-between"><span className="text-secondary">Name</span><span>{rental.posted_by_name}</span></div>
          <div className="flex justify-between"><span className="text-secondary">Phone</span><span>{rental.posted_by_contact}</span></div>
        </div>
      </div>

      {rental.listing_url && (
        <a href={rental.listing_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl hover:bg-white transition text-sm">
          View on {rental.website} ↗
        </a>
      )}
    </div>
  );
}
