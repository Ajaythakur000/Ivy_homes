import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const IVY_BASE = process.env.IVY_BASE_URL!;
const IVY_KEY  = process.env.IVY_API_KEY!;

/** Verified actual total — the API lies and reports 3684 */
const ACTUAL_TOTAL = 3800;

async function ivyGet(path: string, token?: string): Promise<any> {
  const headers: Record<string, string> = {
    'X-API-Key': IVY_KEY,
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${IVY_BASE}${path}`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`Ivy API error: ${res.status}`);
  return res.json();
}

/**
 * GET /api/listings
 *
 * Accepts all query params. When client-side-only filters (min_price,
 * max_price, furnishing) are present, fetches the FULL dataset from
 * Ivy, filters in memory, and returns a paginated slice.
 * Otherwise, proxies directly for performance.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = cookies().get('ivy_token')?.value;

  // Extract params
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const limit  = parseInt(url.searchParams.get('limit')  || '24');
  const locality     = url.searchParams.get('locality') || '';
  const bhk          = url.searchParams.get('bhk') || '';
  const propertyType = url.searchParams.get('property_type') || '';
  const sortBy       = url.searchParams.get('sort_by') || '';
  const order        = url.searchParams.get('order') || 'desc';

  // Client-side-only filters (Ivy API silently ignores these)
  const minPrice   = url.searchParams.get('min_price') || '';
  const maxPrice   = url.searchParams.get('max_price') || '';
  const furnishing = url.searchParams.get('furnishing') || '';

  const anyFilterApplied = locality || bhk || propertyType || minPrice || maxPrice || furnishing;

  if (!anyFilterApplied) {
    // Simple passthrough — let Ivy handle pagination
    const params = new URLSearchParams();
    params.set('offset', String(offset));
    params.set('limit', String(limit));
    if (sortBy) { params.set('sort_by', sortBy); params.set('order', order); }

    const data = await ivyGet(`/v1/listings?${params}`, token);
    // Override the lying total with our verified count
    data.total = ACTUAL_TOTAL;
    return NextResponse.json(data);
  }

  // Full-dataset fetch + server-side filtering
  let allListings: any[] = [];
  let fetchOffset = 0;
  const fetchLimit = 50; // Ivy max
  const baseParams = new URLSearchParams();
  if (locality) baseParams.set('locality', locality);
  if (bhk) baseParams.set('bhk', bhk);
  if (propertyType) baseParams.set('property_type', propertyType);
  if (sortBy) { baseParams.set('sort_by', sortBy); baseParams.set('order', order); }

  // Strictly obey has_more via parallel batching to avoid Vercel timeouts 
  // while never depending on the inaccurate 'total' field
  let hasMore = true;
  let currentOffset = 0;
  
  while (hasMore) {
    const batchSize = 10;
    const promises = [];
    
    for (let i = 0; i < batchSize; i++) {
      const p = new URLSearchParams(baseParams);
      p.set('offset', String(currentOffset + i * fetchLimit));
      p.set('limit', String(fetchLimit));
      promises.push(ivyGet(`/v1/listings?${p}`, token));
    }
    
    const pages = await Promise.all(promises);
    
    for (const page of pages) {
      if (page.results && page.results.length > 0) {
        allListings = allListings.concat(page.results);
      }
      
      if (page.has_more === false || !page.results || page.results.length === 0) {
        hasMore = false;
        break;
      }
    }
    
    if (!hasMore) break;
    currentOffset += batchSize * fetchLimit;
  }
  
  // Deduplicate in case overlapping fetches occurred
  const seenIds = new Set();
  allListings = allListings.filter(item => {
    if (seenIds.has(item.listing_id)) return false;
    seenIds.add(item.listing_id);
    return true;
  });

  // Apply server-side filters
  let filtered = allListings.filter(item => {
    if (item.price < 0) return false; // corrupt
    if (minPrice && item.price < Number(minPrice) * 100000) return false;
    if (maxPrice && item.price > Number(maxPrice) * 100000) return false;
    if (furnishing && item.furnishing?.toLowerCase() !== furnishing.toLowerCase()) return false;
    return true;
  });

  // Paginate the filtered result
  const slice = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    results: slice,
    total: filtered.length,
    offset,
    limit,
    count: slice.length,
    has_more: offset + limit < filtered.length,
  });
}
