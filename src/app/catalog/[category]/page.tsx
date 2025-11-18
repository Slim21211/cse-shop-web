import CatalogPageClient from './сatalogPageClient';

interface PageProps {
  params: { category: string };
}

export default function Page({ params }: PageProps) {
  return <CatalogPageClient category={params.category} />;
}
