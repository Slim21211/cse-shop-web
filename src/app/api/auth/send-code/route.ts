// app/api/auth/send-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ВАЖНО: В production использовать Redis или базу данных
// Текущее решение с Map работает только в одном процессе Node.js
const codes = new Map<string, { code: string; expiresAt: number }>();

const CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 минут
const CODE_LENGTH = 6;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Создаем транспортер один раз для переиспользования
const transporter = nodemailer.createTransport({
  host: 'smtp.cse.ru',
  port: 587,
  secure: false,
  requireTLS: true,
  connectionTimeout: 10000,
  tls: {
    rejectUnauthorized: false,
    secureProtocol: 'TLSv1_2_method',
  },
  auth: {
    user: 'giftshop@cse.ru',
    pass: process.env.MAIL_PASSWORD,
  },
});

// Экспортируем для использования в verify-code
export { codes };

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    // Проверяем формат email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    const code = generateCode();
    const expiresAt = Date.now() + CODE_EXPIRY_MS;

    // Сохраняем код (нормализуем email к lowercase)
    codes.set(email.toLowerCase(), { code, expiresAt });

    // Отправляем письмо
    await transporter.sendMail({
      from: '"Магазин подарков КСЭ" <giftshop@cse.ru>',
      to: email,
      subject: 'Код подтверждения входа',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FE5000;">Код подтверждения</h2>
          <p>Ваш код для входа в Магазин подарков КСЭ:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666;">Код действителен 5 минут.</p>
          <p style="color: #666; font-size: 12px;">Если вы не запрашивали этот код, проигнорируйте это письмо.</p>
        </div>
      `,
    });

    console.log('✅ Code sent to:', email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Send code error:', error);
    return NextResponse.json(
      { error: 'Не удалось отправить код. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
