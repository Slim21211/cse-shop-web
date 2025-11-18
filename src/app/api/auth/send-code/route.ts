import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Хранилище кодов (в production использовать Redis)
const codes = new Map<string, { code: string; expiresAt: number }>();

// Генерация случайного 6-значного кода
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Настройка транспортера
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

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Генерируем код
    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 минут

    // Сохраняем код
    codes.set(email.toLowerCase(), { code, expiresAt });

    // Отправляем письмо
    await transporter.sendMail({
      from: '"Магазин подарков КСЭ" <giftshop@cse.ru>',
      to: email,
      subject: 'Код подтверждения',
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { error: 'Не удалось отправить код' },
      { status: 500 }
    );
  }
}
