/**
 * Fetch ALL data from Ivy Homes API — listings, rentals, projects
 * Saves to data/ directory for analysis
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });

const BASE = process.env.IVY_BASE_URL || 'https://solve.ivy.homes';
const KEY = process.env.IVY_API_KEY;
const PWD = process.env.IVY_DEMO_PASSWORD;

async function apiFetch(path, token, params = {}) {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: {
      'X-API-Key': KEY,
      'Authorization': `Bearer ${token}`,
    }
  });
  if (!res.ok) {
    throw new Error(`${res.status} at ${path}: ${await res.text()}`);
  }
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

/**
 * Fetch all pages from a paginated endpoint
 * Handles both page-based and offset-based pagination
 */
async function fetchAll(path, token, limit = 50) {
  const allRecords = [];
  let page = 1;
  let total = null;
  
  while (true) {
    const data = await apiFetch(path, token, { page, limit });
    const results = data.results || data.data || [];
    
    if (total === null) {
      total = data.total ?? data.count ?? 0;
      console.log(`  ${path}: total=${total}`);
    }
    
    allRecords.push(...results);
    console.log(`  Page ${page}: +${results.length} = ${allRecords.length}/${total}`);
    
    if (results.length === 0 || allRecords.length >= total) break;
    
    // Check if API uses has_more 
    if (data.has_more === false) break;
    
    page++;
    await new Promise(r => setTimeout(r, 50));
  }
  
  return { records: allRecords, total, pages: page };
}

async function run() {
  console.log('=== FETCHING ALL IVY HOMES DATA ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Login
  const auth = await login();
  const token = auth.access_token;
  console.log('Logged in. Token obtained.\n');
  
  // Fetch listings
  console.log('--- LISTINGS ---');
  const listings = await fetchAll('/v1/listings', token);
  console.log(`Total listings fetched: ${listings.records.length}`);
  
  // Fetch rentals
  console.log('\n--- RENTALS ---');
  const rentals = await fetchAll('/v1/rentals', token);
  console.log(`Total rentals fetched: ${rentals.records.length}`);
  
  // Fetch projects
  console.log('\n--- PROJECTS ---');
  const projects = await fetchAll('/v1/projects', token);
  console.log(`Total projects fetched: ${projects.records.length}`);
  
  // Fetch localities
  console.log('\n--- LOCALITIES ---');
  let localities = null;
  try {
    localities = await apiFetch('/v1/localities', token);
    console.log('Localities:', JSON.stringify(localities));
  } catch (e) {
    console.log('Localities failed:', e.message);
  }
  
  // Save data
  const timestamp = new Date().toISOString();
  
  writeFileSync(join(DATA_DIR, 'listings.json'), JSON.stringify(listings.records, null, 2));
  writeFileSync(join(DATA_DIR, 'rentals.json'), JSON.stringify(rentals.records, null, 2));
  writeFileSync(join(DATA_DIR, 'projects.json'), JSON.stringify(projects.records, null, 2));
  writeFileSync(join(DATA_DIR, 'metadata.json'), JSON.stringify({
    fetched_at: timestamp,
    api_key_prefix: KEY.slice(0, 8),
    city: process.env.IVY_CITY,
    assigned_locality: process.env.IVY_ASSIGNED_LOCALITY,
    listings_total: listings.total,
    listings_fetched: listings.records.length,
    listings_pages: listings.pages,
    rentals_total: rentals.total,
    rentals_fetched: rentals.records.length,
    rentals_pages: rentals.pages,
    projects_total: projects.total,
    projects_fetched: projects.records.length,
    projects_pages: projects.pages,
    localities: localities,
  }, null, 2));
  
  console.log(`\nData saved to ${DATA_DIR}`);
  console.log(`  listings.json: ${listings.records.length} records`);
  console.log(`  rentals.json: ${rentals.records.length} records`);
  console.log(`  projects.json: ${projects.records.length} records`);
  console.log(`  metadata.json: fetch metadata`);
  
  console.log('\n=== FETCH COMPLETE ===');
}

run().catch(e => console.error('Fatal:', e));
