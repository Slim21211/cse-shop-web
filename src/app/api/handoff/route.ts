// Путь в проекте: src/app/api/handoff/route.ts
// Это "ручка" магазина: открытие адреса /api/handoff запускает этот код на сервере.
// Он проверяет, что пользователь залогинен, выдаёт подписанный пропуск (на 90 сек)
// и перекидывает в админку. Email в URL больше не передаём.

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getSession } from '@/lib/sessions';
import { getCurrentUser, getUserRole, hasAcknowledgedManagerRules } from '@/lib/data';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // 1. Залогинен ли человек в магазине (его userId лежит в куке-сессии).
  const session = await getSession();
  if (!session) {
    // нет — возвращаем в личный кабинет
    return NextResponse.redirect(new URL('/account', req.url));
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/account', req.url));
  const role = await getUserRole(user.id, user.ispring_user_id);
  if (role === 'none') return NextResponse.redirect(new URL('/account', req.url));
  if (role === 'manager' && !(await hasAcknowledgedManagerRules(user.id))) {
    return NextResponse.redirect(new URL('/account?rules=required', req.url));
  }

  // 2. Делаем подписанный "пропуск" с userId внутри, срок жизни 90 секунд.
  const secret = new TextEncoder().encode(process.env.HANDOFF_SECRET!);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.userId)
    .setIssuer('shop')
    .setAudience('admin')
    .setIssuedAt()
    .setExpirationTime('90s')
    .setJti(crypto.randomUUID())
    .sign(secret);

  // 3. Отправляем в админку. Пропуск кладём во фрагмент (#), чтобы он не попадал в логи.
  const target = `${process.env.ADMIN_APP_URL}/#t=${encodeURIComponent(token)}`;
  return NextResponse.redirect(target);
}
