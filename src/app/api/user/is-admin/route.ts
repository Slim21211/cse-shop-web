// app/api/user/is-admin/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/sessions';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { isAdmin: false, error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Получаем email пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', session.userId)
      .single();

    if (userError || !userData) {
      console.error('❌ Error fetching user:', userError);
      return NextResponse.json({ isAdmin: false });
    }

    // Проверяем, есть ли email в таблице admins
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();

    if (adminError) {
      console.error('❌ Error checking admin:', adminError);
      return NextResponse.json({ isAdmin: false });
    }

    const isAdmin = !!adminData;

    console.log(`✅ Admin check for ${userData.email}:`, isAdmin);

    return NextResponse.json({
      isAdmin,
      email: userData.email,
    });
  } catch (error) {
    console.error('❌ Is admin API error:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
