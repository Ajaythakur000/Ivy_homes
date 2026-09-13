import { NextRequest, NextResponse } from 'next/server';

const IVY_BASE = process.env.IVY_BASE_URL!;
const IVY_KEY  = process.env.IVY_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const ivyRes = await fetch(`${IVY_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'X-API-Key': IVY_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!ivyRes.ok) {
      const err = await ivyRes.text();
      return NextResponse.json({ error: 'Login failed' }, { status: ivyRes.status });
    }

    const data = await ivyRes.json();
    const response = NextResponse.json({
      email: data.user?.email || email,
    });

    const isProd = process.env.NODE_ENV === 'production';

    // Set HttpOnly cookies — never accessible to JS
    response.cookies.set('ivy_token', data.access_token, {
      httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 900,
    });
    response.cookies.set('ivy_refresh', data.refresh_token, {
      httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 86400,
    });
    response.cookies.set('ivy_email', data.user?.email || email, {
      httpOnly: false, secure: isProd, sameSite: 'lax', path: '/', maxAge: 86400,
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
