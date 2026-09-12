'use client'
import { useState, useEffect } from 'react';
import { fetchApi, toggleSaved } from '@/lib/api';
import Link from 'next/link';

function formatPrice(price: number) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function ListingDetail({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadListing() {
      try {
        const res = await fetchApi(`/v1/listings/${params.id}`);
        if (res.ok) {
          setListing(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [params.id]);

  const handleSave = async () => {
    try {
      await toggleSaved(params.id, saved);
      setSaved(!saved);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-secondary">Loading listing...</div>;
  if (!listing) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-secondary">Listing not found</div>;

  const ppsf = listing.carpet_area > 0 ? Math.round(listing.price / listing.carpet_area) : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-secondary mb-6">
        <Link href="/explore" className="hover:text-primary">Explore</Link>
        <span>/</span>
        <span className="capitalize">{listing.locality}</span>
        <span>/</span>
        <span className="text-primary">{listing.apartment_name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">{listing.apartment_name}</h1>
          <p className="text-secondary mt-1 capitalize">{listing.locality}, Pune</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold">{formatPrice(listing.price)}</p>
          {ppsf && <p className="text-sm text-secondary mt-1">₹{ppsf.toLocaleString('en-IN')}/sqft</p>}
        </div>
      </div>

      {/* Status badges */}
      <div className="flex gap-2 mb-8">
        <span className={`text-xs px-3 py-1 rounded-full ${listing.is_live ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {listing.is_live ? '● Active' : '○ Inactive'}
        </span>
        {listing.is_verified && <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">✓ Verified</span>}
        <span className="text-xs px-3 py-1 rounded-full bg-[#F7F6F2] text-secondary capitalize">{listing.property_type}</span>
        <button onClick={handleSave} className="text-xs px-3 py-1 rounded-full border border-border hover:bg-[#F7F6F2] transition ml-auto">
          {saved ? '♥ Saved' : '♡ Save'}
        </button>
      </div>

      {/* Key Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 border border-border rounded-xl bg-white">
          <div className="text-xs text-secondary uppercase tracking-wide">Bedrooms</div>
          <div className="font-semibold text-lg mt-1">{listing.bedroom} BHK</div>
        </div>
        <div className="p-4 border border-border rounded-xl bg-white">
          <div className="text-xs text-secondary uppercase tracking-wide">Bathrooms</div>
          <div className="font-semibold text-lg mt-1">{listing.bathroom}</div>
        </div>
        <div className="p-4 border border-border rounded-xl bg-white">
          <div className="text-xs text-secondary uppercase tracking-wide">Carpet Area</div>
          <div className="font-semibold text-lg mt-1">{listing.carpet_area} sqft</div>
        </div>
        <div className="p-4 border border-border rounded-xl bg-white">
          <div className="text-xs text-secondary uppercase tracking-wide">Super Built-Up</div>
          <div className="font-semibold text-lg mt-1">{listing.super_built_up_area} sqft</div>
        </div>
        <div className="p-4 border border-border rounded-xl bg-white">
          <div className="text-xs text-secondary uppercase tracking-wide">Floor</div>
          <div className="font-semibold text-lg mt-1">{listing.floor} / {listing.total_floors}</div>
        </div>
        <div className="p-4 border border-border rounded-xl bg-white">
          <div className="text-xs text-secondary uppercase tracking-wide">Furnishing</div>
          <div className="font-semibold text-lg mt-1 capitalize">{listing.furnishing}</div>
        </div>
        <div className="p-4 border border-border rounded-xl bg-white">
          <div className="text-xs text-secondary uppercase tracking-wide">Facing</div>
          <div className="font-semibold text-lg mt-1 capitalize">{listing.facing_direction}</div>
        </div>
        <div className="p-4 border border-border rounded-xl bg-white">
          <div className="text-xs text-secondary uppercase tracking-wide">Parking</div>
          <div className="font-semibold text-lg mt-1">{listing.covered_parking} covered</div>
        </div>
      </div>
      
      {/* Description */}
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-3">About this property</h2>
        <p className="text-secondary leading-relaxed">{listing.description || 'No description available.'}</p>
      </div>

      {/* Contact & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-5 border border-border rounded-xl bg-white">
          <h3 className="font-medium mb-3">Contact</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-secondary">Posted by</span><span className="capitalize">{listing.posted_by}</span></div>
            <div className="flex justify-between"><span className="text-secondary">Name</span><span>{listing.posted_by_name}</span></div>
            <div className="flex justify-between"><span className="text-secondary">Phone</span><span>{listing.posted_by_contact}</span></div>
          </div>
        </div>
        <div className="p-5 border border-border rounded-xl bg-white">
          <h3 className="font-medium mb-3">Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-secondary">Listing ID</span><span className="font-mono text-xs">{listing.listing_id}</span></div>
            <div className="flex justify-between"><span className="text-secondary">Source Website</span><span className="capitalize">{listing.website}</span></div>
            <div className="flex justify-between"><span className="text-secondary">Posted</span><span>{new Date(listing.posted_at).toLocaleDateString()}</span></div>
            {listing.project_id && <div className="flex justify-between"><span className="text-secondary">Project</span><Link href={`/project/${listing.project_id}`} className="text-accent hover:underline">{listing.project_id}</Link></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
