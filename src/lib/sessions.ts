// lib/session.ts

import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'user-session-id';
const SESSION_EXPIRY_DAYS = 30;

interface UserSession {
  userId: string;
}

/**
 * Устанавливает куку сессии для пользователя.
 */
export async function setSession(userId: string) {
  const cookieStore = await cookies();

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + SESSION_EXPIRY_DAYS);

  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiryDate,
    path: '/',
  });
}

/**
 * Получает ID пользователя из куки сессии.
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }
  return { userId: sessionId };
}

/**
 * Удаляет куку сессии.
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    expires: new Date(0),
    path: '/',
  });
}
