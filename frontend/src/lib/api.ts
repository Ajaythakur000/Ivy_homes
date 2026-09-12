const API_BASE = process.env.NEXT_PUBLIC_IVY_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_IVY_API_KEY;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('X-API-Key', API_KEY || '');
  headers.set('Content-Type', 'application/json');

  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('access_token');
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    // Attempt token refresh
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY || '',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.access_token) {
          localStorage.setItem('access_token', refreshData.access_token);
          headers.set('Authorization', `Bearer ${refreshData.access_token}`);
          // Retry original request
          res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
          });
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  }

  return res;
}

export async function login(email: string, password: string) {
  const res = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
  }
  return data;
}

export async function fetchListings(params: Record<string, any> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  const res = await fetchApi(`/v1/listings?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch listings');
  return res.json();
}

export async function fetchRentals(params: Record<string, any> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  const res = await fetchApi(`/v1/rentals?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch rentals');
  return res.json();
}

export async function fetchProjects(params: Record<string, any> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  const res = await fetchApi(`/v1/projects?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function getSaved() {
  const res = await fetchApi('/v1/saved');
  if (!res.ok) throw new Error('Failed to fetch saved listings');
  return res.json();
}

export async function toggleSaved(id: string, isSaved: boolean) {
  const res = await fetchApi('/v1/saved', {
    method: isSaved ? 'DELETE' : 'POST',
    body: JSON.stringify({ listing_id: id })
  });
  if (!res.ok) throw new Error('Failed to toggle saved status');
  return res.json();
}
