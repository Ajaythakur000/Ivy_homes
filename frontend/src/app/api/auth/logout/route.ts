import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set('ivy_token', '', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0 });
  response.cookies.set('ivy_refresh', '', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0 });
  response.cookies.set('ivy_email', '', { httpOnly: false, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
