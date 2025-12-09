import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { StoreProvider } from '@/lib/store/storeProvider';
import { createClient } from '@/lib/supabase/server';
import { getUserPoints } from '@/lib/ispring/api';
import { Metadata } from 'next/types';
import { Header } from '@/components/layout/header/header';
import { Footer } from '@/components/layout/footer/footer';
import { cookies } from 'next/headers';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

const THEME_COOKIE_KEY = 'cse-theme';

export const metadata: Metadata = {
  title: 'КСЭ - Магазин подарков',
  description: 'Интернет-магазин корпоративных подарков и мерча компании КСЭ',
  keywords: 'КСЭ, подарки, мерч, баллы, корпоративный магазин',
  authors: [{ name: 'КСЭ' }],
  openGraph: {
    title: 'КСЭ - Магазин подарков',
    description: 'Обменивайте баллы на фирменный мерч и подарки',
    type: 'website',
  },
};

async function getUserData() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!userData) return null;

    const points = await getUserPoints(userData.ispring_user_id);

    return {
      name: `${userData.first_name} ${userData.last_name}`,
      points,
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

async function getCartItemsCount() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return 0;

    const { data } = await supabase
      .from('cart_items_web')
      .select('quantity', { count: 'exact' })
      .eq('user_id', session.user.id);

    return data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  } catch (error) {
    return 0;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserData();
  const cartItemsCount = await getCartItemsCount();

  // ИСПРАВЛЕНО: Чтение куки на сервере с использованием 'await'
  const cookieStore = await cookies();
  const storedTheme = cookieStore.get(THEME_COOKIE_KEY)?.value as
    | 'light'
    | 'dark'
    | undefined;

  const ssrTheme =
    storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'light';

  return (
    <html lang="ru" data-theme={ssrTheme} suppressHydrationWarning>
      <head>{/* Скрипты темы удалены */}</head>
      <body className={inter.className}>
        <StoreProvider>
          <Header user={user} cartItemsCount={cartItemsCount} />
          <main style={{ minHeight: 'calc(100vh - var(--header-height))' }}>
            {children}
          </main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
