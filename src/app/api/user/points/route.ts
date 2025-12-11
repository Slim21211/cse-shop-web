// app/api/user/points/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/sessions';
import { getUserPoints } from '@/lib/ispring/api';

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
      .select('ispring_user_id')
      .eq('id', session.userId)
      .single();

    if (error || !userData) {
      console.error('❌ Error fetching user:', error);
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const points = await getUserPoints(userData.ispring_user_id);

    return NextResponse.json({ points });
  } catch (error) {
    console.error('❌ Points API error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
