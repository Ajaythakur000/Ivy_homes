/**
 * Server-only helper for calling the Ivy Homes API.
 * Attaches X-API-Key and optionally the auth token from the cookie.
 * NEVER import this file from client components.
 */
import { cookies } from 'next/headers';

const IVY_BASE = process.env.IVY_BASE_URL!;
const IVY_KEY  = process.env.IVY_API_KEY!;

export async function ivyFetch(
  path: string,
  init: RequestInit = {},
  /** Pass false for auth routes that don't need a Bearer token */
  withAuth = true
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  headers.set('X-API-Key', IVY_KEY);
  headers.set('Content-Type', 'application/json');

  if (withAuth) {
    const cookieStore = cookies();
    const token = cookieStore.get('ivy_token')?.value;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(`${IVY_BASE}${path}`, { ...init, headers, cache: 'no-store' });
}

/** Read the refresh token from the cookie */
export function getRefreshToken(): string | undefined {
  return cookies().get('ivy_refresh')?.value;
}
