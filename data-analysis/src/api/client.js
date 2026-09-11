import 'dotenv/config';

const BASE_URL = process.env.IVY_BASE_URL || 'https://solve.ivy.homes';
const API_KEY = process.env.IVY_API_KEY;

if (!API_KEY) {
  console.error('ERROR: IVY_API_KEY not set in .env');
  process.exit(1);
}

/**
 * Make an authenticated GET request to the Ivy API
 */
export async function apiGet(path, params = {}) {
  const url = new URL(path, BASE_URL);
  url.searchParams.set('api_key', API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  
  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status} at ${path}: ${body}`);
  }
  return res.json();
}

/**
 * Make an authenticated POST request
 */
export async function apiPost(path, body = {}, token = null) {
  const url = new URL(path, BASE_URL);
  url.searchParams.set('api_key', API_KEY);
  
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API POST ${res.status} at ${path}: ${text}`);
  }
  return res.json();
}

/**
 * Login and get auth token
 */
export async function login(email = 'demo1@ivy.homes') {
  const password = process.env.IVY_DEMO_PASSWORD;
  return apiPost('/auth/login', { email, password });
}

/**
 * Fetch ALL pages from a paginated endpoint. 
 * Returns { records, total, pages }
 */
export async function fetchAllPages(path, params = {}, limit = 200) {
  const allRecords = [];
  let page = 1;
  let total = null;
  
  while (true) {
    const data = await apiGet(path, { ...params, page, limit });
    
    // Discover actual pagination shape
    const results = data.results || data.data || [];
    if (total === null) {
      total = data.total ?? data.count ?? 0;
      console.log(`  ${path}: total=${total}, fetching with limit=${limit}...`);
    }
    
    allRecords.push(...results);
    console.log(`  Page ${page}: got ${results.length} records (cumulative: ${allRecords.length}/${total})`);
    
    if (results.length === 0 || allRecords.length >= total) break;
    page++;
    
    // Small delay to be respectful
    await new Promise(r => setTimeout(r, 50));
  }
  
  return { records: allRecords, total, pages: page };
}

export { BASE_URL, API_KEY };
