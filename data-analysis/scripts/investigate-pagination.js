/**
 * Deep investigation of pagination behavior and data integrity
 */
import 'dotenv/config';

const BASE = process.env.IVY_BASE_URL || 'https://solve.ivy.homes';
const KEY = process.env.IVY_API_KEY;
const PWD = process.env.IVY_DEMO_PASSWORD;

async function apiFetch(path, token, params = {}) {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), {
    headers: { 'X-API-Key': KEY, 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

async function login() {
  const url = new URL('/auth/login', BASE);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo1@ivy.homes', password: PWD })
  });
  return res.json();
}

async function run() {
  const auth = await login();
  const token = auth.access_token;

  // ============================================================
  // 1. Understand pagination shape for LISTINGS
  // ============================================================
  console.log('=== LISTINGS PAGINATION DEEP DIVE ===\n');
  
  // Check response shape at different pages
  for (const page of [1, 2, 3, 4]) {
    const data = await apiFetch('/v1/listings', token, { page, limit: 5 });
    const r = data.results || data.data || [];
    console.log(`Page ${page}, limit=5:`);
    console.log(`  Response keys:`, Object.keys(data));
    console.log(`  total: ${data.total}, count: ${data.count}, has_more: ${data.has_more}`);
    console.log(`  limit: ${data.limit}, offset: ${data.offset}`);
    console.log(`  IDs:`, r.map(x => x.listing_id));
  }
  
  // Check if page and offset work differently
  console.log('\n--- Testing offset-based pagination ---');
  for (const offset of [0, 5, 10, 50, 100]) {
    const data = await apiFetch('/v1/listings', token, { offset, limit: 5 });
    const r = data.results || data.data || [];
    console.log(`offset=${offset}, limit=5: total=${data.total}, count=${data.count}, offset=${data.offset}, IDs:`, r.map(x => x.listing_id));
  }
  
  // Check if page parameter is actually an offset
  console.log('\n--- Page vs offset comparison ---');
  const p1 = await apiFetch('/v1/listings', token, { page: 1, limit: 10 });
  const p2 = await apiFetch('/v1/listings', token, { page: 2, limit: 10 });
  const p3 = await apiFetch('/v1/listings', token, { page: 3, limit: 10 });
  console.log('Page 1 IDs:', (p1.results || []).map(x => x.listing_id));
  console.log('Page 2 IDs:', (p2.results || []).map(x => x.listing_id));
  console.log('Page 3 IDs:', (p3.results || []).map(x => x.listing_id));
  console.log('Page 1 offset:', p1.offset, 'Page 2 offset:', p2.offset, 'Page 3 offset:', p3.offset);
  
  // Check overlap between pages
  const ids1 = new Set((p1.results || []).map(x => x.listing_id));
  const ids2 = new Set((p2.results || []).map(x => x.listing_id));
  const overlap = [...ids1].filter(id => ids2.has(id));
  console.log('Overlap between page 1 and 2:', overlap.length, overlap);

  // ============================================================
  // 2. Find true total by collecting all unique IDs
  // ============================================================
  console.log('\n=== COLLECTING ALL UNIQUE LISTINGS ===');
  const allIds = new Set();
  const allRecords = new Map();
  let page = 1;
  let stalePages = 0;
  
  while (true) {
    const data = await apiFetch('/v1/listings', token, { page, limit: 50 });
    const results = data.results || data.data || [];
    
    if (results.length === 0) break;
    
    let newIds = 0;
    for (const r of results) {
      if (!allIds.has(r.listing_id)) {
        allIds.add(r.listing_id);
        allRecords.set(r.listing_id, r);
        newIds++;
      }
    }
    
    console.log(`Page ${page}: +${results.length} records, ${newIds} new, total unique: ${allIds.size}/${data.total}`);
    
    if (newIds === 0) {
      stalePages++;
      if (stalePages >= 3) {
        console.log('3 consecutive stale pages, stopping.');
        break;
      }
    } else {
      stalePages = 0;
    }
    
    if (allIds.size >= data.total) break;
    page++;
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log(`\nFinal: ${allIds.size} unique listings from ${page} pages`);
  
  // ============================================================
  // 3. Try offset-based collection
  // ============================================================
  console.log('\n=== COLLECTING VIA OFFSET ===');
  const allIdsOffset = new Set();
  const allRecordsOffset = new Map();
  let offset = 0;
  const limit = 50;
  
  while (true) {
    const data = await apiFetch('/v1/listings', token, { offset, limit });
    const results = data.results || data.data || [];
    
    if (results.length === 0) break;
    
    let newIds = 0;
    for (const r of results) {
      if (!allIdsOffset.has(r.listing_id)) {
        allIdsOffset.add(r.listing_id);
        allRecordsOffset.set(r.listing_id, r);
        newIds++;
      }
    }
    
    console.log(`Offset ${offset}: +${results.length} records, ${newIds} new, unique: ${allIdsOffset.size}/${data.total}, has_more: ${data.has_more}`);
    
    if (!data.has_more) {
      console.log('has_more is false, stopping.');
      break;
    }
    
    offset += limit;
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log(`\nFinal via offset: ${allIdsOffset.size} unique listings`);
  
  // ============================================================
  // 4. Rentals pagination check
  // ============================================================
  console.log('\n=== RENTALS PAGINATION ===');
  const r1 = await apiFetch('/v1/rentals', token, { page: 1, limit: 5 });
  console.log('Rentals page 1 keys:', Object.keys(r1));
  console.log('  limit:', r1.limit, 'offset:', r1.offset, 'count:', r1.count, 'total:', r1.total, 'has_more:', r1.has_more);
  
  // Try offset
  const r1o = await apiFetch('/v1/rentals', token, { offset: 0, limit: 5 });
  const r2o = await apiFetch('/v1/rentals', token, { offset: 5, limit: 5 });
  console.log('offset=0 IDs:', (r1o.results || []).map(x => x.listing_id));
  console.log('offset=5 IDs:', (r2o.results || []).map(x => x.listing_id));
  
  // Collect all rentals properly
  console.log('\n--- Collecting all rentals via offset ---');
  const allRentals = new Map();
  offset = 0;
  while (true) {
    const data = await apiFetch('/v1/rentals', token, { offset, limit: 50 });
    const results = data.results || data.data || [];
    if (results.length === 0) break;
    let newR = 0;
    for (const r of results) {
      if (!allRentals.has(r.listing_id)) { allRentals.set(r.listing_id, r); newR++; }
    }
    console.log(`  offset=${offset}: +${results.length}, ${newR} new, unique: ${allRentals.size}/${data.total}, has_more: ${data.has_more}`);
    if (!data.has_more) break;
    offset += 50;
    await new Promise(r => setTimeout(r, 50));
  }
  console.log(`Total unique rentals: ${allRentals.size}`);
  
  // ============================================================
  // 5. Projects pagination
  // ============================================================
  console.log('\n=== PROJECTS PAGINATION ===');
  const allProjects = new Map();
  offset = 0;
  while (true) {
    const data = await apiFetch('/v1/projects', token, { offset, limit: 50 });
    const results = data.results || data.data || [];
    if (results.length === 0) break;
    let newP = 0;
    for (const r of results) {
      if (!allProjects.has(r.project_id)) { allProjects.set(r.project_id, r); newP++; }
    }
    console.log(`  offset=${offset}: +${results.length}, ${newP} new, unique: ${allProjects.size}/${data.total}, has_more: ${data.has_more}`);
    if (!data.has_more) break;
    offset += 50;
    await new Promise(r => setTimeout(r, 50));
  }
  console.log(`Total unique projects: ${allProjects.size}`);
  
  console.log('\n=== PAGINATION INVESTIGATION COMPLETE ===');
}

run().catch(e => console.error('Fatal:', e));
