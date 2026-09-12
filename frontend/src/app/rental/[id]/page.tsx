'use client'
import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

export default function RentalDetail({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListing() {
      try {
        const res = await fetchApi(`/v1/rentals/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setListing(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [params.id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!listing) return <div className="p-8">Rental not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-4">{listing.name || 'Unnamed Rental'}</h1>
      <p className="text-secondary mb-6">{listing.locality}</p>
      
      <div className="aspect-video bg-gray-200 rounded-lg mb-8 overflow-hidden">
        {listing.images?.[0] ? (
          <img src={listing.images[0]} alt={listing.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary">No image available</div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 border border-border rounded-lg bg-white">
          <div className="text-sm text-secondary">Rent</div>
          <div className="font-semibold">₹{listing.price_min?.toLocaleString()} / month</div>
        </div>
        <div className="p-4 border border-border rounded-lg bg-white">
          <div className="text-sm text-secondary">Deposit</div>
          <div className="font-semibold">₹{listing.deposit ? listing.deposit.toLocaleString() : 'N/A'}</div>
        </div>
        <div className="p-4 border border-border rounded-lg bg-white">
          <div className="text-sm text-secondary">BHK</div>
          <div className="font-semibold">{listing.bhk || 'N/A'}</div>
        </div>
        <div className="p-4 border border-border rounded-lg bg-white">
          <div className="text-sm text-secondary">Area</div>
          <div className="font-semibold">{listing.area || 'N/A'} sqft</div>
        </div>
      </div>
      
      <div className="prose">
        <h3 className="text-xl font-medium mb-2">Description</h3>
        <p className="text-secondary leading-relaxed">{listing.description || 'No description available.'}</p>
      </div>
    </div>
  );
}
