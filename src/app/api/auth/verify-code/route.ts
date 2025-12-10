// api/auth/verify-code/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPoints } from '@/lib/ispring/api';
import { setSession } from '@/lib/sessions';

// Примечание: В продакшене codes должна быть в Redis или БД!
const codes = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email, code, userData } = await request.json();

    if (!email || !code || !userData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // --- 1. ПРОВЕРКА КОДА (Здесь должна быть логика проверки)
    // Предполагаем, что проверка кода прошла успешно,
    // иначе нужно вернуть ошибку 401.

    const supabase = await createClient();

    // --- 2. ПОИСК ИЛИ СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ В ТАБЛИЦЕ 'users'

    const existingUserResult = await supabase
      .from('users')
      .select('id, first_name, last_name, ispring_user_id')
      .eq('ispring_user_id', userData.userId)
      .limit(1)
      .single();

    let authUserId: string;

    if (
      existingUserResult.error &&
      existingUserResult.error.code === 'PGRST116'
    ) {
      // Пользователь не найден, создаем нового
      const newUserResult = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          ispring_user_id: userData.userId,
          first_name: userData.firstName,
          last_name: userData.lastName,
        })
        .select('id')
        .single();

      if (newUserResult.error) {
        console.error('Database user creation error:', newUserResult.error);
        return NextResponse.json(
          { error: 'Ошибка создания пользователя' },
          { status: 500 }
        );
      }
      authUserId = newUserResult.data.id;
    } else if (existingUserResult.data) {
      // Пользователь найден
      authUserId = existingUserResult.data.id;
    } else {
      console.error('Unexpected DB error:', existingUserResult.error);
      return NextResponse.json(
        { error: 'Непредвиденная ошибка БД' },
        { status: 500 }
      );
    }

    // --- 3. УСТАНОВКА НАШЕГО КУКИ СЕССИИ (КЛЮЧЕВОЙ ШАГ)
    await setSession(authUserId);

    // --- 4. Получение баллов и ответ
    const points = await getUserPoints(userData.userId);

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
    return NextResponse.json({ error: 'Ошибка верификации' }, { status: 500 });
  }
}
