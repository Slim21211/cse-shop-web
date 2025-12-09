import { NextRequest, NextResponse } from 'next/server';
import { getISpringUsers } from '@/lib/ispring/api';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Checking email:', email);

    // Получаем список пользователей из iSpring
    const users = await getISpringUsers();
    console.log('Total users fetched:', users.length);

    // Ищем пользователя по email (без учета регистра)
    const user = users.find((u) => {
      // ИСПРАВЛЕНИЕ: правильная обработка полей
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

    // ИСПРАВЛЕНИЕ: правильное извлечение данных
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
    // Логируем детальную ошибку
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
