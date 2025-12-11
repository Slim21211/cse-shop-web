// app/layout.tsx
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import '@/styles/globals.css';
import { createClient } from '@/lib/supabase/server';
import { getUserPoints } from '@/lib/ispring/api';
import { getSession } from '@/lib/sessions';
import { Header } from '@/components/layout/header/header';
import { Footer } from '@/components/layout/footer/footer';
import { StoreProvider } from '@/components/providers/storeProvider';

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
    const session = await getSession();
    if (!session) return null;

    const supabase = await createClient();

    const { data: userData, error } = await supabase
      .from('users')
      .select('first_name, last_name, ispring_user_id')
      .eq('id', session.userId)
      .single();

    if (error || !userData) {
      console.error('❌ Error fetching user from DB:', error);
      return null;
    }

    const points = await getUserPoints(userData.ispring_user_id);

    return {
      name: `${userData.first_name} ${userData.last_name}`,
      points,
    };
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    return null;
  }
}

async function getCartItemsCount() {
  try {
    const session = await getSession();
    if (!session) return 0;

    const supabase = await createClient();

    const { data } = await supabase
      .from('cart_items')
      .select('quantity', { count: 'exact' })
      .eq('user_id', session.userId);

    return data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  } catch (error) {
    console.error('❌ Error fetching cart count:', error);
    return 0;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, cartItemsCount] = await Promise.all([
    getUserData(),
    getCartItemsCount(),
  ]);

  const cookieStore = await cookies();
  const storedTheme = cookieStore.get(THEME_COOKIE_KEY)?.value as
    | 'light'
    | 'dark'
    | undefined;

  const ssrTheme =
    storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'light';

  return (
    <html lang="ru" data-theme={ssrTheme} suppressHydrationWarning>
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
