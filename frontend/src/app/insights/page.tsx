'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/analysis-data.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(true); setLoading(false); });
  }, []);

  if (loading) return <div className="max-w-7xl mx-auto px-6 py-16 text-center text-secondary">Loading insights...</div>;
  if (error || !data) return <div className="max-w-7xl mx-auto px-6 py-16 text-center text-red-500">Failed to load insights data.</div>;

  const { answers } = data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-primary mb-3">Intelligence Dashboard</h1>
        <p className="text-secondary text-lg">Key metrics and analytical findings from the Ivy Homes dataset.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Card 1 */}
        <div className="p-6 border border-white/[0.08] rounded-xl bg-surface shadow-sm hover:shadow-md transition">
          <div className="text-sm font-medium text-secondary uppercase tracking-wider mb-2">Total Records</div>
          <div className="text-4xl font-semibold text-primary">{answers.total_listing_records.toLocaleString()}</div>
        </div>
        
        {/* Card 2 */}
        <div className="p-6 border border-white/[0.08] rounded-xl bg-surface shadow-sm hover:shadow-md transition">
          <div className="text-sm font-medium text-secondary uppercase tracking-wider mb-2">Unique Properties</div>
          <div className="text-4xl font-semibold text-primary">{answers.unique_properties.toLocaleString()}</div>
        </div>

        {/* Card 3 */}
        <div className="p-6 border border-white/[0.08] rounded-xl bg-green-50 shadow-sm hover:shadow-md transition">
          <div className="text-sm font-medium text-green-700 uppercase tracking-wider mb-2">Active Listings</div>
          <div className="text-4xl font-semibold text-green-900">{answers.active_listings.toLocaleString()}</div>
        </div>

        {/* Card 4 */}
        <div className="p-6 border border-red-500/20 rounded-xl bg-red-500/10 shadow-sm hover:shadow-md transition">
          <div className="text-sm font-medium text-red-400 uppercase tracking-wider mb-2">Corrupt Records</div>
          <div className="text-4xl font-semibold text-red-900">{answers.corrupt_listing_ids.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Financial Metrics */}
        <div className="p-8 border border-white/[0.08] rounded-xl bg-surface shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Financial Metrics</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/[0.08]/50 pb-4">
              <span className="text-secondary">Total Monthly Rent (Balewadi)</span>
              <span className="text-xl font-medium">₹{answers.total_monthly_rent.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/[0.08]/50 pb-4">
              <span className="text-secondary">Avg Price/sqft (2 BHK)</span>
              <span className="text-xl font-medium">₹{answers.avg_price_per_sqft_2bhk.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex flex-col border-b border-white/[0.08]/50 pb-4">
              <span className="text-secondary mb-1">Costliest Project</span>
              <div className="flex justify-between items-end">
                <Link href={`/project/${answers.costliest_project.project_id}`} className="text-accent hover:underline font-medium">
                  {answers.costliest_project.project_id}
                </Link>
                <span className="text-xl font-medium">₹{(answers.costliest_project.price_max_inr / 10000000).toFixed(2)} Cr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Integrity */}
        <div className="p-8 border border-white/[0.08] rounded-xl bg-surface shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Platform Integrity</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/[0.08]/50 pb-4">
              <span className="text-secondary">New Listings (Last 7 Days)</span>
              <span className="text-xl font-medium">{answers.listings_last_7_days}</span>
            </div>
            <div className="flex flex-col border-b border-white/[0.08]/50 pb-4">
              <span className="text-secondary mb-1">Fake/Fraud Listings</span>
              <div className="flex justify-between items-end">
                <span className="text-xl font-medium text-red-600">{answers.fake_listing_ids.length} detected</span>
              </div>
            </div>
            <div className="flex justify-between items-center border-b border-white/[0.08]/50 pb-4">
              <span className="text-secondary">Projects w/ Count Mismatch</span>
              <span className="text-xl font-medium">{answers.projects_with_wrong_listing_count}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
