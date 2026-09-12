import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('ivy_token')?.value;
  const email = cookieStore.get('ivy_email')?.value;

  if (token) {
    return NextResponse.json({ authenticated: true, email: email || null });
  }
  return NextResponse.json({ authenticated: false, email: null });
}
