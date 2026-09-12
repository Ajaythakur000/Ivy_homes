import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const IVY_BASE = process.env.IVY_BASE_URL!;
const IVY_KEY  = process.env.IVY_API_KEY!;

async function proxyRequest(req: NextRequest, path: string) {
  const url = new URL(req.url);
  const ivyUrl = `${IVY_BASE}/${path}${url.search}`;

  const headers: Record<string, string> = {
    'X-API-Key': IVY_KEY,
    'Content-Type': 'application/json',
  };

  const cookieStore = cookies();
  const token = cookieStore.get('ivy_token')?.value;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const init: RequestInit = { method: req.method, headers, cache: 'no-store' };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try { init.body = await req.text(); } catch {}
  }

  let res = await fetch(ivyUrl, init);

  // Auto-refresh on 401
  if (res.status === 401) {
    const refreshToken = cookieStore.get('ivy_refresh')?.value;
    if (refreshToken) {
      const refreshRes = await fetch(`${IVY_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'X-API-Key': IVY_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.access_token) {
          headers['Authorization'] = `Bearer ${data.access_token}`;
          res = await fetch(ivyUrl, { ...init, headers });

          // Update cookies on the response
          const response = NextResponse.json(await res.json(), { status: res.status });
          const isProd = process.env.NODE_ENV === 'production';
          response.cookies.set('ivy_token', data.access_token, {
            httpOnly: true, secure: isProd, sameSite: 'strict', path: '/', maxAge: 900,
          });
          if (data.refresh_token) {
            response.cookies.set('ivy_refresh', data.refresh_token, {
              httpOnly: true, secure: isProd, sameSite: 'strict', path: '/', maxAge: 86400,
            });
          }
          return response;
        }
      }
    }
  }

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path.join('/'));
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path.join('/'));
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path.join('/'));
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path.join('/'));
}
