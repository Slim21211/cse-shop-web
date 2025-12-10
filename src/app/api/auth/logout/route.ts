// api/auth/logout/route.ts
import { deleteSession } from '@/lib/sessions';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
