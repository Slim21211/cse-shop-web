import { NextRequest, NextResponse } from 'next/server';
import { getISpringUsers } from '@/lib/ispring/api';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Получаем список пользователей из iSpring
    const users = await getISpringUsers();

    // Ищем пользователя по email (без учета регистра)
    const user = users.find((u) => {
      const userEmail = u.fields.find((f) => f.name === 'EMAIL')?.value;
      return userEmail?.toLowerCase() === email.toLowerCase();
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Извлекаем данные пользователя
    const firstName =
      user.fields.find((f) => f.name === 'FIRST_NAME')?.value || '';
    const lastName =
      user.fields.find((f) => f.name === 'LAST_NAME')?.value || '';

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
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
