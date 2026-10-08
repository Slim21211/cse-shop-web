// МАГАЗИН: src/app/api/auth/logout/route.ts
// При выходе помечаем пользователя logged_out_at = сейчас, затем чистим куку.
import { getSession, deleteSession } from '@/lib/sessions';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      const supabase = await createClient();
      await supabase
        .from('users')
        .update({ logged_out_at: new Date().toISOString() })
        .eq('id', session.userId);
    }
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
