import { Metadata } from 'next';
import CatalogPageClient from './сatalogPageClient';

interface PageProps {
  params: { category: string };
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const category = (await props.params).category;

  const title = category === 'merch' ? 'Мерч компании' : 'Подарки отдела';
  const description =
    category === 'merch'
      ? 'Фирменная одежда, аксессуары и сувениры с логотипом КСЭ'
      : 'Эксклюзивные подарки для сотрудников и партнеров компании КСЭ';

  return {
    title,
    description,
    openGraph: {
      title: `${title} | КСЭ Магазин подарков`,
      description,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const category = resolvedParams.category;

  return <CatalogPageClient category={category} />;
}
