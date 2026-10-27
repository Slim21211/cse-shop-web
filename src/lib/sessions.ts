// lib/sessions.ts
// Сессия хранится в httpOnly-куке как подписанный JWT. Раньше в куке лежал «голый» users.id,
// и любой, кто знал чужой id, мог подставить его и войти под этим пользователем.

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'user-session-id';
const SESSION_EXPIRY_DAYS = 30;

interface UserSession {
  userId: string;
}

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET is missing or shorter than 32 characters');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Проверяет токен сессии. Используется и в proxy, где куки читаются из request.
 */
export async function verifySessionToken(
  token: string | undefined
): Promise<UserSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      issuer: 'shop',
      audience: 'shop-session',
      algorithms: ['HS256'],
    });
    return payload.sub ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}

/**
 * Устанавливает куку сессии для пользователя.
 */
export async function setSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer('shop')
    .setAudience('shop-session')
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
    .sign(getAuthSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * Получает ID пользователя из куки сессии.
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

/**
 * Удаляет куку сессии.
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
