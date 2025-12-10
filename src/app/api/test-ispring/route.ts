import { NextResponse } from 'next/server';
import { getISpringToken, getISpringUsers } from '@/lib/ispring/api';

export async function GET() {
  try {
    console.log('=== Testing iSpring API ===');

    // Проверяем переменные окружения
    const env = {
      ISPRING_DOMAIN: process.env.ISPRING_DOMAIN,
      ISPRING_CLIENT_ID: process.env.ISPRING_CLIENT_ID,
      ISPRING_CLIENT_SECRET: process.env.ISPRING_CLIENT_SECRET
        ? '***'
        : undefined,
      ISPRING_API_DOMAIN: process.env.ISPRING_API_DOMAIN,
    };

    console.log('Environment variables:', env);

    // Пробуем получить токен
    const token = await getISpringToken();
    console.log('✅ Token received:', token.substring(0, 20) + '...');

    // Пробуем получить пользователей
    const users = await getISpringUsers();
    console.log('✅ Users received:', users.length);

    return NextResponse.json({
      success: true,
      env: env,
      tokenLength: token.length,
      usersCount: users.length,
      firstUser: users[0]
        ? {
            userId: users[0].userId,
            hasFields: !!users[0].fields,
          }
        : null,
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        env: {
          ISPRING_DOMAIN: process.env.ISPRING_DOMAIN,
          ISPRING_CLIENT_ID: process.env.ISPRING_CLIENT_ID ? 'SET' : 'NOT SET',
          ISPRING_CLIENT_SECRET: process.env.ISPRING_CLIENT_SECRET
            ? 'SET'
            : 'NOT SET',
          ISPRING_API_DOMAIN: process.env.ISPRING_API_DOMAIN,
        },
      },
      { status: 500 }
    );
  }
}
