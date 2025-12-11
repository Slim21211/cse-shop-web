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
  metadataBase: new URL('https://gift-shop.cse.ru'), // Ваш домен
  title: {
    default: 'КСЭ - Магазин подарков',
    template: '%s | КСЭ Магазин подарков',
  },
  description:
    'Интернет-магазин корпоративных подарков и мерча компании КСЭ. Обменивайте заработанные баллы на фирменную одежду, аксессуары и эксклюзивные подарки.',
  keywords: [
    'КСЭ',
    'подарки КСЭ',
    'мерч КСЭ',
    'корпоративные подарки',
    'баллы КСЭ',
    'магазин подарков',
    'фирменная одежда',
    'корпоративный магазин',
  ],
  authors: [{ name: 'КСЭ', url: 'https://cse.ru' }],
  creator: 'КСЭ',
  publisher: 'КСЭ',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://cse-shop.ru',
    title: 'КСЭ - Магазин подарков',
    description: 'Обменивайте баллы на фирменный мерч и подарки компании КСЭ',
    siteName: 'КСЭ Магазин подарков',
    images: [
      {
        url: '/logogo.png',
        width: 1200,
        height: 630,
        alt: 'КСЭ Магазин подарков',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'КСЭ - Магазин подарков',
    description: 'Обменивайте баллы на фирменный мерч и подарки',
    images: ['/logogo.png'],
  },
  verification: {
    // google: 'your-google-verification-code', // Добавьте после регистрации в Search Console
    // yandex: 'your-yandex-verification-code', // Добавьте после регистрации в Яндекс.Вебмастер
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
