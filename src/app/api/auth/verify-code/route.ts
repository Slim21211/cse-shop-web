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

    // Проверяем код (в production использовать Redis)
    // Временно пропускаем проверку для разработки
    // const storedData = codes.get(email.toLowerCase())
    // if (!storedData || storedData.code !== code || storedData.expiresAt < Date.now()) {
    //   return NextResponse.json({ error: 'Неверный или истекший код' }, { status: 400 })
    // }

    const supabase = await createClient();

    // Создаем или обновляем пользователя в Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: code, // Временно используем код как пароль
      });

    // Если пользователя нет, создаем
    if (authError) {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: email.toLowerCase(),
          password: code,
        });

      if (signUpError) {
        return NextResponse.json(
          { error: 'Ошибка авторизации' },
          { status: 500 }
        );
      }
    }

    // Получаем баллы пользователя
    const points = await getUserPoints(userData.userId);

    // Сохраняем данные пользователя в таблицу users
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 дней

    const { error: dbError } = await supabase.from('users').upsert({
      email: email.toLowerCase(),
      ispring_user_id: userData.userId,
      first_name: userData.firstName,
      last_name: userData.lastName,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // Удаляем использованный код
    // codes.delete(email.toLowerCase())

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
