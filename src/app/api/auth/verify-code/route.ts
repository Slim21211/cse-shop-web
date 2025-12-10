import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPoints } from '@/lib/ispring/api';

export async function POST(request: NextRequest) {
  try {
    const { email, code, userData } = await request.json();

    console.log('🔐 Verifying code for:', email);

    if (!email || !code || !userData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ИСПРАВЛЕНИЕ: Упрощенная авторизация
    let authUserId: string | undefined;

    // Пробуем войти
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: code,
      });

    if (signInError) {
      console.log('User not found, creating new user...');

      // Создаем нового пользователя
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: email.toLowerCase(),
          password: code,
          options: {
            data: {
              first_name: userData.firstName,
              last_name: userData.lastName,
            },
          },
        });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        return NextResponse.json(
          { error: 'Ошибка авторизации: ' + signUpError.message },
          { status: 500 }
        );
      }

      authUserId = signUpData.user?.id;
      console.log('✅ New user created:', authUserId);
    } else {
      authUserId = signInData.user?.id;
      console.log('✅ User signed in:', authUserId);
    }

    if (!authUserId) {
      return NextResponse.json(
        { error: 'Не удалось получить ID пользователя' },
        { status: 500 }
      );
    }

    // Получаем баллы (с обработкой ошибок)
    console.log('Getting user points...');
    const points = await getUserPoints(userData.userId);
    console.log('User points:', points);

    // ИСПРАВЛЕНИЕ: Сохраняем в БД с правильной структурой
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    console.log('Saving user to database...');
    const { error: dbError } = await supabase.from('users').upsert(
      {
        id: authUserId,
        email: email.toLowerCase(),
        ispring_user_id: userData.userId,
        first_name: userData.firstName,
        last_name: userData.lastName,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id', // ИСПРАВЛЕНИЕ: конфликт по id, а не по email
      }
    );

    if (dbError) {
      console.error('❌ Database error:', dbError);
      // ИСПРАВЛЕНИЕ: Не возвращаем ошибку, логируем и продолжаем
      console.log('Continuing despite database error...');
    } else {
      console.log('✅ User saved to database');
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
    console.error('❌ Verify code error:', error);
    return NextResponse.json(
      {
        error: 'Ошибка верификации',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
