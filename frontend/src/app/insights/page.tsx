'use client'
import { useState, useEffect } from 'react';

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/analysis-data.json');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load analysis data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-8 max-w-7xl mx-auto">Loading insights...</div>;
  if (!data) return <div className="p-8 max-w-7xl mx-auto">No analysis data found. Please ensure public/analysis-data.json exists.</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-2">Platform Insights</h1>
      <p className="text-secondary mb-10">Data intelligence, market statistics, and system investigation findings.</p>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-border">Market Questions (Q1-Q10)</h2>
          <div className="grid gap-6">
            {data.qna?.map((item: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-border shadow-sm">
                <h3 className="font-medium text-lg mb-2">Q{i+1}: {item.question}</h3>
                <p className="text-secondary">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-border">Market Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.statistics && Object.entries(data.statistics).map(([key, val]: any, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-border shadow-sm">
                <div className="text-sm text-secondary uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</div>
                <div className="text-2xl font-semibold">{String(val)}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-border">API Investigation Findings</h2>
          <ul className="list-disc pl-5 space-y-3 text-secondary">
            {data.api_findings?.map((finding: string, i: number) => (
              <li key={i}>{finding}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-border">Data Quality Issues</h2>
          <ul className="list-disc pl-5 space-y-3 text-secondary">
            {data.data_issues?.map((issue: string, i: number) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
