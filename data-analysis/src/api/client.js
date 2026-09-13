import 'dotenv/config';

const BASE_URL = process.env.IVY_BASE_URL || 'https://solve.ivy.homes';
const API_KEY = process.env.IVY_API_KEY;

if (!API_KEY) {
  console.error('ERROR: IVY_API_KEY not set in .env');
  process.exit(1);
}

function getHeaders(token = null) {
  const headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Make an authenticated GET request to the Ivy API
 */
export async function apiGet(path, params = {}, token = null) {
  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  
  const res = await fetch(url.toString(), { headers: getHeaders(token) });
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
  
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: getHeaders(token),
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
 * Fetch ALL records from a paginated endpoint. 
 * Respects effective limit of 50 and uses offset pagination.
 */
export async function fetchAllPages(path, params = {}, limit = 50, token = null) {
  const allRecords = [];
  let offset = 0;
  let total = null;
  
  while (true) {
    const data = await apiGet(path, { ...params, offset, limit }, token);
    
    const results = data.results || [];
    if (total === null) {
      total = data.total ?? 0;
      console.log(`  ${path}: reported total=${total}, fetching with limit=${limit}...`);
    }
    
    allRecords.push(...results);
    console.log(`  Offset ${offset}: got ${results.length} records`);
    
    if (data.has_more === false || results.length === 0) break;
    offset += limit;
  }
  
  return { records: allRecords, total };
}

export { BASE_URL, API_KEY };
