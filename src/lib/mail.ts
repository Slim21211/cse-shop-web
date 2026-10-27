import nodemailer from 'nodemailer';

export const MAIL_FROM = '"Магазин подарков КСЭ" <giftshop@cse.ru>';
export const SHOP_EMAIL = 'giftshop@cse.ru';

// Один транспортер на процесс для всех писем
export const transporter = nodemailer.createTransport({
  host: 'smtp.cse.ru',
  port: 587,
  secure: false,
  requireTLS: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  tls: {
    // Проверка сертификата защищает пароль от почты от перехвата («человек посередине»).
    // Если smtp.cse.ru отдаёт невалидный сертификат и письма перестали уходить, временный
    // откат без правки кода — переменная окружения SMTP_ALLOW_INVALID_CERT=1 в Vercel.
    rejectUnauthorized: process.env.SMTP_ALLOW_INVALID_CERT !== '1',
    secureProtocol: 'TLSv1_2_method',
  },
  auth: {
    user: SHOP_EMAIL,
    pass: process.env.MAIL_PASSWORD,
  },
});

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
