// api/auth/verify-code/route.ts
// Код и данные пользователя проверяются только по подписанной куке из send-code.
// Раньше код не проверялся вовсе, а userData приходил с клиента — можно было войти под кем угодно.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setSession } from '@/lib/sessions';
import { verifyLoginChallenge } from '@/lib/loginCodes';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
    }

    const result = await verifyLoginChallenge(code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const { user } = result;
    const supabase = createClient();

    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('ispring_user_id', user.ispringUserId)
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Unexpected DB error:', findError);
      return NextResponse.json(
        { error: 'Непредвиденная ошибка БД' },
        { status: 500 }
      );
    }

    let authUserId: string;

    if (existingUser) {
      authUserId = existingUser.id;
      await supabase
        .from('users')
        .update({
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          logged_out_at: null,
        })
        .eq('id', authUserId);
    } else {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: user.email,
          ispring_user_id: user.ispringUserId,
          first_name: user.firstName,
          last_name: user.lastName,
        })
        .select('id')
        .single();

      if (createError || !newUser) {
        console.error('Database user creation error:', createError);
        return NextResponse.json(
          { error: 'Ошибка создания пользователя' },
          { status: 500 }
        );
      }
      authUserId = newUser.id;
    }

    await setSession(authUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Verify code error:', error);
    return NextResponse.json({ error: 'Ошибка верификации' }, { status: 500 });
  }
}
