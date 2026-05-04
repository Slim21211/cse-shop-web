// app/api/auth/check-email/route.ts

import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { getISpringUsers, warmUsersCache } from '@/lib/ispring/api';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Checking email:', email);

    // Читаем только из кэша — никакого обращения в iSpring в этом запросе
    const users = await getISpringUsers();

    if (users === null) {
      // Кэш холодный. Запускаем прогрев в фоне через after() —
      // after() выполняется после отправки ответа, Lambda остаётся живой.
      // Следующая попытка логина (через ~30-120 секунд) попадёт в тёплый кэш.
      console.log('🔥 Cache cold — triggering background warm via after()');
      after(warmUsersCache);

      return NextResponse.json(
        {
          error:
            'Система инициализируется. Пожалуйста, попробуйте войти через 30 секунд.',
          retryable: true,
        },
        { status: 503 }
      );
    }

    // Ищем пользователя по email (без учёта регистра)
    const user = users.find((u) => {
      const fields = Array.isArray(u.fields) ? u.fields : [u.fields];
      const emailField = fields.find((f) => f?.name === 'EMAIL');
      const userEmail = emailField?.value;
      return userEmail?.toLowerCase() === email.toLowerCase();
    });

    if (!user) {
      console.log('User not found for email:', email);
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const fields = Array.isArray(user.fields) ? user.fields : [user.fields];
    const firstName = fields.find((f) => f?.name === 'FIRST_NAME')?.value || '';
    const lastName = fields.find((f) => f?.name === 'LAST_NAME')?.value || '';

    console.log('User found:', { firstName, lastName, userId: user.userId });

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        email: email.toLowerCase(),
        firstName,
        lastName,
      },
    });
  } catch (error) {
    console.error('Check email error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        error: 'Ошибка сервера',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
