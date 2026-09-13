/**
 * Client-side API helper.
 * All requests go to our internal Next.js API routes — never to solve.ivy.homes.
 * No API keys, no tokens in client code.
 */

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  return fetch(path, { ...init, headers, credentials: 'same-origin' });
}

// ─── Auth ────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function logout() {
  await api('/api/auth/logout', { method: 'POST' });
}

export async function getSession(): Promise<{ authenticated: boolean; email: string | null }> {
  const res = await api('/api/auth/me');
  if (!res.ok) return { authenticated: false, email: null };
  return res.json();
}

// ─── Listings (uses dedicated handler with server-side filtering) ─
export async function fetchListings(params: Record<string, any> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  const res = await api(`/api/listings?${query}`);
  if (!res.ok) throw new Error('Failed to fetch listings');
  return res.json();
}

// ─── Generic proxy helpers ───────────────────────────────────
export async function fetchRentals(params: Record<string, any> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  const res = await api(`/api/proxy/v1/rentals?${query}`);
  if (!res.ok) throw new Error('Failed to fetch rentals');
  return res.json();
}

export async function fetchProjects(params: Record<string, any> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  const res = await api(`/api/proxy/v1/projects?${query}`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function getSaved(params: Record<string, any> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  const res = await api(`/api/proxy/v1/saved?${query}`);
  if (!res.ok) throw new Error('Failed to fetch saved listings');
  return res.json();
}

export async function saveListing(id: string) {
  const res = await api('/api/proxy/v1/saved', {
    method: 'POST',
    body: JSON.stringify({ listing_id: id }),
  });
  if (!res.ok) throw new Error('Failed to save');
  return res.json();
}

export async function unsaveListing(id: string) {
  const res = await api(`/api/proxy/v1/saved/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to unsave');
  return res.json();
}
