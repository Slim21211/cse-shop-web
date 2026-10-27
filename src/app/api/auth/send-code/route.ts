// app/api/auth/send-code/route.ts
// Ищет пользователя в iSpring и отправляет код. Данные пользователя остаются на сервере
// (в подписанной куке) — клиенту больше не отдаются iSpring userId и ФИО.
import { NextRequest, NextResponse } from 'next/server';
import {
  findISpringUserByEmail,
  getISpringUserField,
} from '@/lib/ispring/api';
import { checkSendLimit, createLoginChallenge } from '@/lib/loginCodes';
import { MAIL_FROM, transporter } from '@/lib/mail';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail } = await request.json();

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();
    if (email.length > 254 || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    const limitError = await checkSendLimit(email);
    if (limitError) {
      return NextResponse.json({ error: limitError }, { status: 429 });
    }

    const ispringUser = await findISpringUserByEmail(email);
    if (!ispringUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const code = await createLoginChallenge({
      ispringUserId: ispringUser.userId,
      email,
      firstName: getISpringUserField(ispringUser, 'FIRST_NAME'),
      lastName: getISpringUserField(ispringUser, 'LAST_NAME'),
    });

    await transporter.sendMail({
      from: MAIL_FROM,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Send code error:', error);
    return NextResponse.json(
      { error: 'Не удалось отправить код. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
