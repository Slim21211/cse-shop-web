import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPoints } from '@/lib/ispring/api';

export async function POST(request: NextRequest) {
  try {
    const { email, code, userData } = await request.json();

    if (!email || !code || !userData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Сначала пытаемся войти
    let userId: string | undefined;

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: code,
      });

    if (signInError) {
      // Если пользователя нет - создаем
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: email.toLowerCase(),
          password: code,
        });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        return NextResponse.json(
          { error: 'Ошибка авторизации' },
          { status: 500 }
        );
      }

      userId = signUpData.user?.id;
    } else {
      userId = signInData.user?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Не удалось получить ID пользователя' },
        { status: 500 }
      );
    }

    // Получаем баллы пользователя
    const points = await getUserPoints(userData.userId);

    // Сохраняем данные пользователя в таблицу users
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: dbError } = await supabase.from('users').upsert({
      id: userId, // ИСПРАВЛЕНИЕ: добавлен id
      email: email.toLowerCase(),
      ispring_user_id: userData.userId,
      first_name: userData.firstName,
      last_name: userData.lastName,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Ошибка сохранения данных' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        email: email.toLowerCase(),
        name: `${userData.firstName} ${userData.lastName}`,
        points,
      },
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: 'Ошибка верификации' }, { status: 500 });
  }
}
