import { NextRequest, NextResponse } from 'next/server';
import { findISpringUserByEmail } from '@/lib/ispring/api';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Checking email:', email);

    const user = await findISpringUserByEmail(email);

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
