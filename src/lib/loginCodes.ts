// lib/loginCodes.ts
// Одноразовые коды входа. send-code кладёт в httpOnly-куку подписанный JWT с данными
// пользователя из iSpring и HMAC кода (сам код в куке не лежит — офлайн не подобрать).
// Счётчик попыток и лимиты отправки хранятся в таблице login_codes: на Vercel у каждого
// инстанса своя память, поэтому in-memory лимиты там не работают.

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { getAuthSecret } from './sessions';
import { createClient } from './supabase/server';

const CHALLENGE_COOKIE_NAME = 'login-challenge';
const CODE_TTL_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 5;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;

export interface LoginUser {
  ispringUserId: string;
  email: string;
  firstName: string;
  lastName: string;
}

function hashCode(jti: string, code: string): string {
  return createHmac('sha256', getAuthSecret()).update(`${jti}:${code}`).digest('hex');
}

/**
 * Возвращает null, если отправлять код можно, иначе — текст ошибки.
 */
export async function checkSendLimit(email: string): Promise<string | null> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await createClient()
    .from('login_codes')
    .select('created_at')
    .eq('email', email)
    .gte('created_at', hourAgo)
    .order('created_at', { ascending: false });

  if (error) throw error;

  if (data.length && Date.now() - Date.parse(data[0].created_at) < SEND_COOLDOWN_MS) {
    return 'Код уже отправлен. Повторная отправка возможна через минуту.';
  }
  if (data.length >= MAX_SENDS_PER_HOUR) {
    return 'Слишком много запросов кода. Попробуйте позже.';
  }
  return null;
}

export async function createLoginChallenge(user: LoginUser): Promise<string> {
  const code = randomInt(100000, 1000000).toString();
  const jti = randomUUID();
  const supabase = createClient();

  const { error } = await supabase.from('login_codes').insert({
    id: jti,
    email: user.email,
    expires_at: new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString(),
  });
  if (error) throw error;

  // Попутно чистим старые записи, чтобы таблица не росла
  await supabase
    .from('login_codes')
    .delete()
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const token = await new SignJWT({ user, codeHash: hashCode(jti, code) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('shop')
    .setAudience('login-challenge')
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${CODE_TTL_SECONDS}s`)
    .sign(getAuthSecret());

  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CODE_TTL_SECONDS,
    path: '/api/auth',
  });

  return code;
}

type VerifyResult =
  | { ok: true; user: LoginUser }
  | { ok: false; error: string };

export async function verifyLoginChallenge(code: string): Promise<VerifyResult> {
  const expired = { ok: false, error: 'Срок действия кода истёк. Запросите новый.' } as const;
  const cookieStore = await cookies();
  const token = cookieStore.get(CHALLENGE_COOKIE_NAME)?.value;
  if (!token) return expired;

  let payload;
  try {
    ({ payload } = await jwtVerify(token, getAuthSecret(), {
      issuer: 'shop',
      audience: 'login-challenge',
      algorithms: ['HS256'],
    }));
  } catch {
    cookieStore.delete({ name: CHALLENGE_COOKIE_NAME, path: '/api/auth' });
    return expired;
  }

  const jti = payload.jti!;
  const supabase = createClient();

  const { data: row, error } = await supabase
    .from('login_codes')
    .select('attempts, used_at')
    .eq('id', jti)
    .maybeSingle();
  if (error) throw error;
  if (!row || row.used_at) return expired;

  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: 'Слишком много попыток. Запросите новый код.' };
  }

  // Попытку засчитываем ДО сравнения кода и через compare-and-swap: параллельные
  // запросы не могут сравнить больше MAX_ATTEMPTS кодов
  const { data: counted } = await supabase
    .from('login_codes')
    .update({ attempts: row.attempts + 1 })
    .eq('id', jti)
    .eq('attempts', row.attempts)
    .is('used_at', null)
    .select('id');
  if (!counted?.length) {
    return { ok: false, error: 'Попробуйте ещё раз' };
  }

  const expected = Buffer.from(payload.codeHash as string, 'hex');
  const actual = Buffer.from(hashCode(jti, code), 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, error: 'Неверный код' };
  }

  // Код одноразовый: второй запрос с тем же кодом не пройдёт
  const { data: used } = await supabase
    .from('login_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', jti)
    .is('used_at', null)
    .select('id');
  if (!used?.length) return expired;

  cookieStore.delete({ name: CHALLENGE_COOKIE_NAME, path: '/api/auth' });
  return { ok: true, user: payload.user as LoginUser };
}
