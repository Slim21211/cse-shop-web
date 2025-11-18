import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { StoreProvider } from '@/lib/store/storeProvider';
import { Metadata } from 'next/types';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
