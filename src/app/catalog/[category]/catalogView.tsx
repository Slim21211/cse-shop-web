'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Gift, ShoppingBag } from 'lucide-react';
import type { Product } from '@/types';
import { pluralizeProducts } from '@/lib/format';
import { ProductCard } from '@/components/product/productCard/productCard';
import styles from './page.module.scss';

interface CatalogViewProps {
  category: 'merch' | 'gifts';
  title: string;
  products: Product[];
  cartProductIds: number[];
  isAuthenticated: boolean;
}

export default function CatalogView({
  category,
  title,
  products,
  cartProductIds,
  isAuthenticated,
}: CatalogViewProps) {
  const router = useRouter();
  // Начальное состояние берётся из корзины на сервере — после перезагрузки
  // кнопка «В корзине» не сбрасывается, и повторное добавление не обнуляет количество
  const [inCart, setInCart] = useState(() => new Set(cartProductIds));
  const [pending, setPending] = useState<number | null>(null);

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/catalog/${category}`);
      return;
    }
    if (pending !== null) return;

    setPending(product.id);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });

      if (response.status === 401) {
        router.push(`/login?redirect=/catalog/${category}`);
        return;
      }

      if (response.ok) {
        setInCart((prev) => new Set(prev).add(product.id));
        router.refresh();
      }
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.navigation}>
          {/* На десктопе — «На главную», на мобильных — переключатель категорий (CSS) */}
          <Link
            href="/"
            className={`${styles.navButton} ${styles.desktopOnly}`}
          >
            <Home size={20} />
            На главную
          </Link>
          {category === 'merch' ? (
            <Link
              href="/catalog/gifts"
              className={`${styles.navButton} ${styles.mobileOnly}`}
            >
              <Gift size={20} />К подаркам
            </Link>
          ) : (
            <Link
              href="/catalog/merch"
              className={`${styles.navButton} ${styles.mobileOnly}`}
            >
              <ShoppingBag size={20} />К мерчу
            </Link>
          )}
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.count}>
            {products.length} {pluralizeProducts(products.length)}
          </p>
        </div>

        {products.length === 0 ? (
          <div className={styles.empty}>
            <p>В этой категории пока нет товаров</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isInCart={inCart.has(product.id)}
                isPending={pending === product.id}
                priority={index < 3}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
