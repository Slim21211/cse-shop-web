import { redirect } from 'next/navigation';
import { getSession } from '@/lib/sessions';
import { LoginForm } from './loginForm';

// Разрешаем только относительные пути внутри сайта. Иначе ?redirect=javascript:...
// выполнял бы чужой код на нашем домене, а ?redirect=//evil.com уводил на фишинг.
function safeRedirect(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return '/';
  }
  return path;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const redirectTo = safeRedirect((await searchParams).redirect);

  if (await getSession()) redirect(redirectTo);

  return <LoginForm redirectTo={redirectTo} />;
}
