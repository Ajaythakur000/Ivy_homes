/**
 * Ivy Homes API Investigation Script — v3
 * Now with proper auth (X-API-Key header + Bearer token)
 */
import 'dotenv/config';

const BASE = process.env.IVY_BASE_URL || 'https://solve.ivy.homes';
const KEY = process.env.IVY_API_KEY;
const PWD = process.env.IVY_DEMO_PASSWORD;

async function rawFetch(path, opts = {}) {
  const url = new URL(path, BASE);
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      url.searchParams.set(k, String(v));
    }
  }
  const headers = { 'X-API-Key': KEY, ...(opts.headers || {}) };
  const fetchOpts = { method: opts.method || 'GET', headers };
  if (opts.body) {
    headers['Content-Type'] = 'application/json';
    fetchOpts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(url.toString(), fetchOpts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, statusText: res.statusText, text, json };
}

async function authedFetch(path, token, opts = {}) {
  return rawFetch(path, {
    ...opts,
    headers: { ...(opts.headers || {}), 'Authorization': `Bearer ${token}` }
  });
}

async function login() {
  const res = await rawFetch('/auth/login', {
    method: 'POST',
    body: { email: 'demo1@ivy.homes', password: PWD }
  });
  return res.json;
}

const log = (section, ...args) => console.log(`\n[${section}]`, ...args);

async function run() {
  console.log('=== IVY HOMES API INVESTIGATION v3 ===\n');
  
  // LOGIN
  const auth = await login();
  const token = auth.access_token;
  console.log('Logged in. Token expires_in:', auth.expires_in);
  console.log('Auth keys:', Object.keys(auth));
  console.log('Has refresh_token:', !!auth.refresh_token);
  console.log('refresh_url:', auth.refresh_url);
  console.log('User:', JSON.stringify(auth.user));
  
  // ============================================================
  // LISTINGS
  // ============================================================
  log('LISTINGS', '--- limit=5 ---');
  const list1 = await authedFetch('/v1/listings', token, { params: { page: 1, limit: 5 } });
  console.log('  Status:', list1.status);
  if (list1.json) {
    console.log('  Top-level keys:', Object.keys(list1.json));
    console.log('  total:', list1.json.total);
    console.log('  page:', list1.json.page);
    console.log('  page_size:', list1.json.page_size);
    const r = list1.json.results || list1.json.data || [];
    console.log('  result count:', r.length);
    if (r[0]) {
      console.log('  RECORD KEYS:', Object.keys(r[0]).sort().join(', '));
      console.log('\n  FIRST RECORD:');
      console.log(JSON.stringify(r[0], null, 2));
      console.log('\n  SECOND RECORD:');
      console.log(JSON.stringify(r[1], null, 2));
    }
  }
  
  // Limit testing
  log('PAGINATION', '--- Testing limits ---');
  for (const lim of [1, 20, 50, 100, 200, 500]) {
    const r = await authedFetch('/v1/listings', token, { params: { page: 1, limit: lim } });
    const results = r.json?.results || r.json?.data || [];
    console.log(`  limit=${lim}: status=${r.status}, returned=${results.length}, page_size=${r.json?.page_size}, total=${r.json?.total}`);
  }
  
  // ============================================================
  // SINGLE LISTING PATHS
  // ============================================================
  const sampleId = (list1.json?.results || list1.json?.data || [])[0]?.listing_id;
  if (sampleId) {
    log('SINGLE LISTING', `Testing paths for ${sampleId}...`);
    for (const p of [`/v1/listing/${sampleId}`, `/v1/listings/${sampleId}`]) {
      const r = await authedFetch(p, token);
      console.log(`  ${p}: status=${r.status}`);
      if (r.status === 200) {
        console.log('    keys:', r.json ? Object.keys(r.json).join(', ') : 'none');
      }
    }
    
    // Similar
    for (const p of [`/v1/listings/${sampleId}/similar`, `/v1/listing/${sampleId}/similar`]) {
      const r = await authedFetch(p, token);
      console.log(`  ${p}: status=${r.status}, body length: ${r.text?.length}`);
    }
  }
  
  // ============================================================
  // FILTERS - thorough testing
  // ============================================================
  const totalAll = list1.json?.total;
  
  log('FILTER:locality', '');
  const fLoc = await authedFetch('/v1/listings', token, { params: { locality: 'balewadi', limit: 10 } });
  const fLocR = fLoc.json?.results || fLoc.json?.data || [];
  console.log('  total:', fLoc.json?.total, '(unfiltered:', totalAll, ')');
  console.log('  localities:', fLocR.map(x => x.locality));
  console.log('  did total change?', fLoc.json?.total !== totalAll);
  
  log('FILTER:bhk', '');
  const fBhk = await authedFetch('/v1/listings', token, { params: { bhk: 2, limit: 10 } });
  const fBhkR = fBhk.json?.results || fBhk.json?.data || [];
  console.log('  total:', fBhk.json?.total);
  console.log('  bedrooms:', fBhkR.map(x => x.bedroom));
  console.log('  all 2?', fBhkR.every(x => x.bedroom === 2));
  
  log('FILTER:min_price', '');
  const fMinP = await authedFetch('/v1/listings', token, { params: { min_price: 50000000, limit: 10 } });
  const fMinPR = fMinP.json?.results || fMinP.json?.data || [];
  console.log('  total:', fMinP.json?.total, 'prices:', fMinPR.map(x => x.price));
  console.log('  all >= 50M?', fMinPR.every(x => x.price >= 50000000));
  
  log('FILTER:max_price', '');
  const fMaxP = await authedFetch('/v1/listings', token, { params: { max_price: 5000000, limit: 10 } });
  const fMaxPR = fMaxP.json?.results || fMaxP.json?.data || [];
  console.log('  total:', fMaxP.json?.total, 'prices:', fMaxPR.map(x => x.price));
  console.log('  all <= 5M?', fMaxPR.every(x => x.price <= 5000000));
  
  log('FILTER:property_type', '');
  const fType = await authedFetch('/v1/listings', token, { params: { property_type: 'apartment', limit: 10 } });
  const fTypeR = fType.json?.results || fType.json?.data || [];
  console.log('  total:', fType.json?.total, 'types:', fTypeR.map(x => x.property_type));
  console.log('  all apartment?', fTypeR.every(x => x.property_type === 'apartment'));
  
  log('FILTER:furnishing', '');
  const fFurn = await authedFetch('/v1/listings', token, { params: { furnishing: 'unfurnished', limit: 10 } });
  const fFurnR = fFurn.json?.results || fFurn.json?.data || [];
  console.log('  total:', fFurn.json?.total, 'furnishing:', fFurnR.map(x => x.furnishing));
  console.log('  all unfurnished?', fFurnR.every(x => x.furnishing === 'unfurnished'));
  
  // ============================================================
  // SORTING
  // ============================================================
  log('SORT:price:asc', '');
  const sAsc = await authedFetch('/v1/listings', token, { params: { sort_by: 'price', order: 'asc', limit: 15 } });
  const sAscR = sAsc.json?.results || sAsc.json?.data || [];
  const pricesAsc = sAscR.map(x => x.price);
  console.log('  prices:', pricesAsc);
  console.log('  sorted asc?', pricesAsc.every((v,i) => i===0 || v >= pricesAsc[i-1]));
  
  log('SORT:price:desc', '');
  const sDescR = (await authedFetch('/v1/listings', token, { params: { sort_by: 'price', order: 'desc', limit: 15 } })).json;
  const pricesDesc = (sDescR?.results || sDescR?.data || []).map(x => x.price);
  console.log('  prices:', pricesDesc);
  console.log('  sorted desc?', pricesDesc.every((v,i) => i===0 || v <= pricesDesc[i-1]));
  
  log('SORT:posted_at:desc', '');
  const sDtR = (await authedFetch('/v1/listings', token, { params: { sort_by: 'posted_at', order: 'desc', limit: 10 } })).json;
  const dates = (sDtR?.results || sDtR?.data || []).map(x => x.posted_at);
  console.log('  dates:', dates);
  
  // ============================================================
  // RENTALS
  // ============================================================
  log('RENTALS', '--- limit=5 ---');
  const rent1 = await authedFetch('/v1/rentals', token, { params: { page: 1, limit: 5 } });
  console.log('  Status:', rent1.status);
  if (rent1.json) {
    console.log('  Top-level keys:', Object.keys(rent1.json));
    console.log('  total:', rent1.json.total);
    const r = rent1.json.results || rent1.json.data || [];
    console.log('  result count:', r.length);
    if (r[0]) {
      console.log('  RENTAL KEYS:', Object.keys(r[0]).sort().join(', '));
      console.log('\n  FIRST RENTAL:');
      console.log(JSON.stringify(r[0], null, 2));
    }
  }
  
  // Rental filter test
  log('RENTAL:FILTER', '--- locality=balewadi ---');
  const rfLoc = await authedFetch('/v1/rentals', token, { params: { locality: 'balewadi', limit: 5 } });
  const rfLocR = rfLoc.json?.results || rfLoc.json?.data || [];
  console.log('  total:', rfLoc.json?.total, 'localities:', rfLocR.map(x => x.locality));
  
  // ============================================================
  // PROJECTS
  // ============================================================
  log('PROJECTS', '--- limit=5 ---');
  const proj1 = await authedFetch('/v1/projects', token, { params: { page: 1, limit: 5 } });
  console.log('  Status:', proj1.status);
  if (proj1.json) {
    console.log('  Top-level keys:', Object.keys(proj1.json));
    console.log('  total:', proj1.json.total);
    const r = proj1.json.results || proj1.json.data || [];
    console.log('  result count:', r.length);
    if (r[0]) {
      console.log('  PROJECT KEYS:', Object.keys(r[0]).sort().join(', '));
      console.log('\n  FIRST PROJECT:');
      console.log(JSON.stringify(r[0], null, 2));
    }
  }
  
  // ============================================================
  // ANALYTICS
  // ============================================================
  log('ANALYTICS', 'Searching for analytics endpoints...');
  for (const p of ['/v1/analytics/summary', '/v1/analytics', '/analytics/summary', '/analytics', '/v1/summary', '/v1/stats', '/v1/dashboard', '/v1/market']) {
    const r = await authedFetch(p, token);
    console.log(`  ${p}: status=${r.status}${r.status !== 404 ? ' FOUND! body=' + r.text?.slice(0, 200) : ''}`);
  }
  
  // ============================================================
  // FAVOURITES
  // ============================================================
  log('FAVOURITES', 'Searching for favourites endpoint...');
  for (const p of ['/v1/favourites', '/v1/favorites', '/favourites', '/favorites', '/v1/saved', '/v1/wishlist']) {
    const r = await authedFetch(p, token);
    console.log(`  ${p}: status=${r.status}${r.status !== 404 ? ' FOUND! body=' + r.text?.slice(0, 200) : ''}`);
  }
  
  // ============================================================
  // UNDOCUMENTED ENDPOINTS
  // ============================================================
  log('UNDOCUMENTED', 'Probing...');
  for (const p of ['/v1/localities', '/v1/filters', '/v1/config', '/v1/metadata', '/auth/refresh', '/auth/me', '/auth/user']) {
    const r = await authedFetch(p, token);
    console.log(`  ${p}: status=${r.status}${r.status !== 404 ? ' FOUND! body=' + r.text?.slice(0, 200) : ''}`);
  }
  
  // ============================================================
  // PROJECT → LISTINGS CONSISTENCY (Q10 prep)
  // ============================================================
  const projId = (proj1.json?.results || proj1.json?.data || [])[0]?.project_id;
  if (projId) {
    log('CONSISTENCY', `Listings for project ${projId}...`);
    const projListings = await authedFetch('/v1/listings', token, { params: { project_id: projId, limit: 200 } });
    const projData = proj1.json?.results || proj1.json?.data || [];
    const projRecord = projData.find(p => p.project_id === projId);
    console.log('  Project reported total_listings:', projRecord?.total_listings);
    console.log('  API listings?project_id total:', projListings.json?.total);
    console.log('  Match?', projRecord?.total_listings === projListings.json?.total);
  }
  
  console.log('\n\n=== INVESTIGATION v3 COMPLETE ===');
}

run().catch(e => console.error('Fatal:', e));
