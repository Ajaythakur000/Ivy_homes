'use client'
import { useState, useEffect } from 'react';

function formatNum(n: number) {
  return n?.toLocaleString('en-IN') ?? 'N/A';
}

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/analysis-data.json')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-16 text-center text-secondary">Loading insights...</div>;
  if (!data) return <div className="max-w-5xl mx-auto px-6 py-16 text-center text-secondary">No analysis data found.</div>;

  const answers = data.answers || {};
  const findings = data.findings || [];
  const stats = data.statistics || {};

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-1">Intelligence Report</h1>
      <p className="text-secondary mb-10">Pune property market analysis · Reference date: 2026-09-10</p>

      {/* Key Metrics */}
      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4 pb-2 border-b border-border">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Listings', value: formatNum(answers.q1_total_listing_records?.value), sub: `API reports ${formatNum(answers.q1_total_listing_records?.api_reported)}` },
            { label: 'Unique Properties', value: formatNum(answers.q2_unique_properties?.value) },
            { label: 'Active Listings', value: formatNum(answers.q3_active_listings?.value), sub: `${((answers.q3_active_listings?.value / answers.q1_total_listing_records?.value) * 100).toFixed(1)}% of total` },
            { label: 'Last 7 Days', value: formatNum(answers.q8_listings_last_7_days?.value) },
          ].map((m, i) => (
            <div key={i} className="p-4 bg-white border border-border rounded-xl">
              <div className="text-xs text-secondary uppercase tracking-wider">{m.label}</div>
              <div className="text-2xl font-semibold mt-1">{m.value}</div>
              {m.sub && <div className="text-xs text-muted mt-1">{m.sub}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Q&A Detail */}
      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4 pb-2 border-b border-border">Data Questions (Q1–Q10)</h2>
        <div className="space-y-4">
          {[
            { q: 'Q1. Total listing records retrievable', a: formatNum(answers.q1_total_listing_records?.value), note: answers.q1_total_listing_records?.note },
            { q: 'Q2. Unique physical properties', a: formatNum(answers.q2_unique_properties?.value), note: answers.q2_unique_properties?.note },
            { q: 'Q3. Active listings (is_live=true)', a: formatNum(answers.q3_active_listings?.value), note: answers.q3_active_listings?.note },
            { q: 'Q4. Corrupt listing IDs', a: `${answers.q4_corrupt_listing_ids?.value} records`, note: answers.q4_corrupt_listing_ids?.criteria },
            { q: 'Q5. Total monthly rent (Balewadi)', a: `₹${formatNum(answers.q5_total_monthly_rent?.value)}`, note: answers.q5_total_monthly_rent?.note },
            { q: 'Q6. Avg price/sqft for 2BHK', a: `₹${formatNum(answers.q6_avg_price_per_sqft_2bhk?.value)}`, note: `Based on ${formatNum(answers.q6_avg_price_per_sqft_2bhk?.eligible_count)} eligible listings` },
            { q: 'Q7. Costliest project', a: `${answers.q7_costliest_project?.project_id} — ₹${formatNum(answers.q7_costliest_project?.price_max_inr)}`, note: `${answers.q7_costliest_project?.apartment_name}. ${answers.q7_costliest_project?.note}` },
            { q: 'Q8. Listings in last 7 days', a: formatNum(answers.q8_listings_last_7_days?.value), note: answers.q8_listings_last_7_days?.note },
            { q: 'Q9. Fake listing IDs', a: `${answers.q9_fake_listing_ids?.value} records`, note: answers.q9_fake_listing_ids?.note },
            { q: 'Q10. Projects with wrong listing count', a: formatNum(answers.q10_projects_with_wrong_listing_count?.value), note: answers.q10_projects_with_wrong_listing_count?.note },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-white border border-border rounded-xl">
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{item.q}</h3>
                <span className="text-lg font-semibold text-accent ml-4 whitespace-nowrap">{item.a}</span>
              </div>
              {item.note && <p className="text-sm text-secondary mt-2">{item.note}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* API Findings */}
      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4 pb-2 border-b border-border">API Investigation Findings</h2>
        <p className="text-sm text-secondary mb-4">{findings.length} discrepancies found between documentation and actual API behavior</p>
        <div className="space-y-3">
          {findings.map((f: any, i: number) => (
            <div key={i} className="p-4 bg-white border border-border rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  f.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  f.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  f.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{f.severity}</span>
                <span className="text-xs text-muted bg-[#F7F6F2] px-2 py-0.5 rounded">{f.category}</span>
              </div>
              <h3 className="font-medium">{f.title}</h3>
              <p className="text-sm text-secondary mt-1">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Market Stats */}
      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4 pb-2 border-b border-border">Market Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-border rounded-xl">
            <h3 className="font-medium mb-3">Listings by Website</h3>
            <div className="space-y-1 text-sm">
              {(stats.websites || []).map((w: string, i: number) => (
                <div key={i} className="flex justify-between text-secondary"><span>{w}</span></div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white border border-border rounded-xl">
            <h3 className="font-medium mb-3">Listings by Locality</h3>
            <div className="space-y-1 text-sm">
              {(stats.localities || []).map((l: string, i: number) => (
                <div key={i} className="flex justify-between text-secondary"><span>{l}</span></div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white border border-border rounded-xl">
            <h3 className="font-medium mb-3">Posted By</h3>
            <div className="space-y-1 text-sm text-secondary">
              {stats.posted_by_breakdown && Object.entries(stats.posted_by_breakdown).map(([k, v]: [string, any]) => (
                <div key={k} className="flex justify-between capitalize"><span>{k}</span><span className="font-medium text-primary">{formatNum(v)}</span></div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white border border-border rounded-xl">
            <h3 className="font-medium mb-3">Verification</h3>
            <div className="space-y-1 text-sm text-secondary">
              {stats.verified_breakdown && Object.entries(stats.verified_breakdown).map(([k, v]: [string, any]) => (
                <div key={k} className="flex justify-between capitalize"><span>{k}</span><span className="font-medium text-primary">{formatNum(v)}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
