// app/layout.tsx
import { Inter } from 'next/font/google';
import { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import '@/styles/globals.css';
import { Header } from '@/components/layout/header/header';
import { Footer } from '@/components/layout/footer/footer';
import { THEME_COOKIE_KEY, type Theme } from '@/components/layout/header/themeToggle';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://cse-shop.ru'),
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

  // ✅ Иконки для браузера и поисковиков
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },

  // ✅ Манифест для PWA
  manifest: '/manifest.json',

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

  // ✅ OpenGraph для социальных сетей (Telegram, VK, FB)
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://cse-shop.ru',
    title: 'КСЭ - Магазин подарков',
    description: 'Обменивайте баллы на фирменный мерч и подарки компании КСЭ',
    siteName: 'КСЭ Магазин подарков',
    images: [
      {
        url: '/og-image.png', // ✅ Правильный путь в /public
        width: 1200,
        height: 630,
        alt: 'КСЭ Магазин подарков',
        type: 'image/png',
      },
    ],
  },

  // ✅ Twitter Card (используется и другими соцсетями)
  twitter: {
    card: 'summary_large_image',
    title: 'КСЭ - Магазин подарков',
    description: 'Обменивайте баллы на фирменный мерч и подарки',
    images: ['/og-image.png'],
  },

  // ✅ Верификация для поисковиков
  verification: {
    google: 'google3c0a4e6f6ac51e49.html',
    yandex: '3ecde8c325b8a551',
  },

  // ✅ Дополнительные метатеги
  other: {
    // Telegram специфичные теги
    'telegram:card': 'summary_large_image',
    'telegram:image': 'https://cse-shop.ru/og-image.png',
    // VK
    'vk:image': 'https://cse-shop.ru/og-image.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

// Тема ещё не выбрана — берём системную до первой отрисовки, чтобы не было вспышки
const systemThemeScript = `try{if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.dataset.theme='dark'}catch(e){}`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout не ждёт данных пользователя: они догружаются в шапке через Suspense,
  // поэтому HTML страницы уходит в браузер сразу
  const cookieStore = await cookies();
  const storedTheme = cookieStore.get(THEME_COOKIE_KEY)?.value;
  const theme: Theme | undefined =
    storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : undefined;

  return (
    <html
      lang="ru"
      data-theme={theme ?? 'light'}
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        {!theme && (
          <script dangerouslySetInnerHTML={{ __html: systemThemeScript }} />
        )}
      </head>
      <body className={inter.className}>
        <Header initialTheme={theme ?? 'light'} />
        <main style={{ minHeight: 'calc(100vh - var(--header-height))' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
