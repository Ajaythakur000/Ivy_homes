import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('ivy_token', '', { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0 });
  response.cookies.set('ivy_refresh', '', { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0 });
  response.cookies.set('ivy_email', '', { httpOnly: false, secure: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}
