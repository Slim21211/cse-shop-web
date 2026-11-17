import { NextResponse } from 'next/server';
import { getSession } from '@/lib/sessions';
import { getCurrentUser, getUserRole } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });

    const user = await getCurrentUser();
    if (!user || user.id !== session.userId) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 401 });
    }
    const role = await getUserRole(user.id, user.ispring_user_id);
    if (role !== 'manager') {
      return NextResponse.json({ error: 'Подтверждение доступно только руководителям' }, { status: 403 });
    }

    const { error } = await createClient()
      .from('manager_rules_acknowledgements')
      .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
    if (error) {
      console.error('❌ Manager rules acknowledgement save error:', error);
      return NextResponse.json({ error: 'Не удалось сохранить подтверждение' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Manager rules acknowledgement POST error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
