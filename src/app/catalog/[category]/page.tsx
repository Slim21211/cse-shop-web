import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCartItems, getProducts } from '@/lib/data';
import { getSession } from '@/lib/sessions';
import CatalogView from './catalogView';

interface PageProps {
  params: Promise<{ category: string }>;
}

const CATEGORIES = {
  merch: {
    title: 'Мерч компании',
    description: 'Фирменная одежда, аксессуары и сувениры с логотипом КСЭ',
    isGift: false,
  },
  gifts: {
    title: 'Подарки отдела',
    description:
      'Эксклюзивные подарки для сотрудников и партнеров компании КСЭ',
    isGift: true,
  },
} as const;

type Category = keyof typeof CATEGORIES;

function getCategory(category: string) {
  return Object.hasOwn(CATEGORIES, category)
    ? CATEGORIES[category as Category]
    : null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const config = getCategory((await params).category);
  if (!config) return {};

  return {
    title: config.title,
    description: config.description,
    openGraph: {
      title: `${config.title} | КСЭ Магазин подарков`,
      description: config.description,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { category } = await params;
  const config = getCategory(category);
  if (!config) notFound();

  const session = await getSession();
  const [products, cartItems] = await Promise.all([
    getProducts(config.isGift),
    session ? getCartItems(session.userId) : [],
  ]);

  return (
    <CatalogView
      category={category as Category}
      title={config.title}
      products={products}
      cartProductIds={cartItems.map((item) => item.product_id)}
      isAuthenticated={!!session}
    />
  );
}
