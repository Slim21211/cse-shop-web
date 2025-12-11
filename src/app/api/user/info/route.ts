// app/api/user/info/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/sessions';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data: userData, error } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', session.userId)
      .single();

    if (error || !userData) {
      console.error('❌ Error fetching user:', error);
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error('❌ User info API error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
