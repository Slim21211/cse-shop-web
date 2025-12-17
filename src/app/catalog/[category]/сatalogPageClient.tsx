'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Gift, ShoppingBag } from 'lucide-react';
import { useGetProductsQuery } from '@/lib/store/api/productsApi';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { addToCart, selectCartItems } from '@/lib/store/slices/cartSlice';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import type { Product } from '@/types';
import { ProductCard } from '@/components/product/productCard/productCard';
import styles from './page.module.scss';

interface CatalogPageClientProps {
  category: string;
}

export default function CatalogPageClient({
  category,
}: CatalogPageClientProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const isMobile = useIsMobile();

  // ✅ Оптимистичные обновления
  const [optimisticCartIds, setOptimisticCartIds] = useState<Set<number>>(
    new Set()
  );
  const [isPending, startTransition] = useTransition();

  const { data: products, isLoading, error } = useGetProductsQuery(category);

  const categoryTitle =
    category === 'merch' ? 'Мерч компании' : 'Подарки отдела';

  const handleAddToCart = async (product: Product) => {
    // ✅ МГНОВЕННО показываем, что товар добавлен
    setOptimisticCartIds((prev) => new Set(prev).add(product.id));

    // ✅ Сразу добавляем в Redux store (оптимистично)
    dispatch(addToCart(product));

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
        }),
      });

      if (response.status === 401) {
        // Откатываем оптимистичное обновление
        setOptimisticCartIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });

        router.push('/login?redirect=/catalog/' + category);
        return;
      }

      if (!response.ok) {
        // Если ошибка - откатываем
        setOptimisticCartIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
        console.error('Failed to add to cart');
      }

      // ✅ Обновляем данные в фоне без перезагрузки страницы
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      // Откатываем при ошибке
      setOptimisticCartIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
      console.error('Add to cart error:', error);
    }
  };

  const isInCart = (productId: number) => {
    // Проверяем как реальное состояние, так и оптимистичное
    return (
      optimisticCartIds.has(productId) ||
      cartItems.some((item) => item.product.id === productId)
    );
  };

  // Определяем кнопку навигации в зависимости от устройства и категории
  const renderNavigationButton = () => {
    if (!isMobile) {
      // На десктопе всегда "На главную"
      return (
        <Link href="/" className={styles.navButton}>
          <Home size={20} />
          На главную
        </Link>
      );
    }

    // На мобильных показываем переключатель между категориями
    if (category === 'merch') {
      return (
        <Link href="/catalog/gifts" className={styles.navButton}>
          <Gift size={20} />К подаркам
        </Link>
      );
    } else {
      return (
        <Link href="/catalog/merch" className={styles.navButton}>
          <ShoppingBag size={20} />К мерчу
        </Link>
      );
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <h1 className={styles.title}>Загрузка...</h1>
          <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: 400 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className="container">
          <h1 className={styles.title}>Ошибка загрузки</h1>
          <p>Не удалось загрузить товары. Попробуйте обновить страницу.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.navigation}>{renderNavigationButton()}</div>

        <div className={styles.header}>
          <h1 className={styles.title}>{categoryTitle}</h1>
          <p className={styles.count}>
            {products?.length || 0}{' '}
            {products?.length === 1 ? 'товар' : 'товаров'}
          </p>
        </div>

        {!products || products.length === 0 ? (
          <div className={styles.empty}>
            <p>В этой категории пока нет товаров</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isInCart={isInCart(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
