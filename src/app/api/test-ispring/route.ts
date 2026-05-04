import { NextRequest, NextResponse } from 'next/server';
import { getISpringToken, findISpringUserByEmail } from '@/lib/ispring/api';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Testing iSpring API ===');

    const env = {
      ISPRING_DOMAIN: process.env.ISPRING_DOMAIN,
      ISPRING_CLIENT_ID: process.env.ISPRING_CLIENT_ID,
      ISPRING_CLIENT_SECRET: process.env.ISPRING_CLIENT_SECRET
        ? '***'
        : undefined,
      ISPRING_API_DOMAIN: process.env.ISPRING_API_DOMAIN,
    };

    console.log('Environment variables:', env);

    const token = await getISpringToken();
    console.log('✅ Token received:', token.substring(0, 20) + '...');

    // Тестируем поиск по email (подставь реальный адрес через ?email=...)
    const testEmail =
      request.nextUrl.searchParams.get('email') || 'test@cse.ru';
    const user = await findISpringUserByEmail(testEmail);

    return NextResponse.json({
      success: true,
      env,
      tokenLength: token.length,
      searchedEmail: testEmail,
      userFound: !!user,
      user: user ? { userId: user.userId, hasFields: !!user.fields } : null,
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
