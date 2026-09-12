/**
 * Fetch ALL data using correct offset-based pagination
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
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), {
    headers: { 'X-API-Key': KEY, 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`${res.status} at ${path}: ${await res.text()}`);
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

async function fetchAllOffset(path, token, idField = 'listing_id', limit = 50) {
  const records = [];
  const seenIds = new Set();
  let offset = 0;
  let total = null;
  
  while (true) {
    const data = await apiFetch(path, token, { offset, limit });
    const results = data.results || data.data || [];
    if (total === null) {
      total = data.total;
      console.log(`  ${path}: reported total=${total}`);
    }
    
    if (results.length === 0) break;
    
    for (const r of results) {
      const id = r[idField];
      if (!seenIds.has(id)) {
        seenIds.add(id);
        records.push(r);
      }
    }
    
    console.log(`  offset=${offset}: +${results.length}, unique=${records.length}, has_more=${data.has_more}`);
    if (!data.has_more) break;
    offset += limit;
    await new Promise(r => setTimeout(r, 50));
  }
  
  return { records, reportedTotal: total, actualTotal: records.length };
}

async function run() {
  console.log('=== FETCHING ALL DATA (OFFSET-BASED) ===');
  
  const auth = await login();
  const token = auth.access_token;
  console.log('Logged in.\n');
  
  console.log('--- LISTINGS ---');
  const listings = await fetchAllOffset('/v1/listings', token, 'listing_id');
  console.log(`Listings: reported=${listings.reportedTotal}, actual=${listings.actualTotal}\n`);
  
  console.log('--- RENTALS ---');
  const rentals = await fetchAllOffset('/v1/rentals', token, 'listing_id');
  console.log(`Rentals: reported=${rentals.reportedTotal}, actual=${rentals.actualTotal}\n`);
  
  console.log('--- PROJECTS ---');
  const projects = await fetchAllOffset('/v1/projects', token, 'project_id');
  console.log(`Projects: reported=${projects.reportedTotal}, actual=${projects.actualTotal}\n`);
  
  // Localities
  let localities = null;
  try {
    localities = await apiFetch('/v1/localities', token);
    console.log('Localities:', JSON.stringify(localities));
  } catch (e) {
    console.log('Localities failed:', e.message);
  }
  
  // Save
  writeFileSync(join(DATA_DIR, 'listings.json'), JSON.stringify(listings.records, null, 2));
  writeFileSync(join(DATA_DIR, 'rentals.json'), JSON.stringify(rentals.records, null, 2));
  writeFileSync(join(DATA_DIR, 'projects.json'), JSON.stringify(projects.records, null, 2));
  writeFileSync(join(DATA_DIR, 'metadata.json'), JSON.stringify({
    fetched_at: new Date().toISOString(),
    pagination_method: 'offset-based',
    listings: { reported_total: listings.reportedTotal, actual: listings.actualTotal },
    rentals: { reported_total: rentals.reportedTotal, actual: rentals.actualTotal },
    projects: { reported_total: projects.reportedTotal, actual: projects.actualTotal },
    localities,
  }, null, 2));
  
  console.log('\nData saved successfully.');
}

run().catch(e => console.error('Fatal:', e));
