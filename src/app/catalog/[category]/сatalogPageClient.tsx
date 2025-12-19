'use client';

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

  const { data: products, isLoading, error } = useGetProductsQuery(category);

  const categoryTitle =
    category === 'merch' ? 'Мерч компании' : 'Подарки отдела';

  const handleAddToCart = async (product: Product) => {
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
        router.push('/login?redirect=/catalog/' + category);
        return;
      }

      if (response.ok) {
        dispatch(addToCart(product));
        router.refresh();
      }
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  const isInCart = (productId: number) => {
    return cartItems.some((item) => item.product.id === productId);
  };

  // ✅ Сортировка товаров
  const sortProducts = (products: Product[]): Product[] => {
    return [...products].sort((a, b) => {
      // 1️⃣ Сначала товары в наличии (remains > 0)
      const aInStock = a.remains > 0 ? 1 : 0;
      const bInStock = b.remains > 0 ? 1 : 0;

      if (aInStock !== bInStock) {
        return bInStock - aInStock; // В наличии выше
      }

      // 2️⃣ Потом по цене (от меньшей к большей)
      return a.price - b.price;
    });
  };

  // Применяем сортировку к товарам
  const sortedProducts = products ? sortProducts(products) : [];

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
            {sortedProducts?.length || 0}{' '}
            {sortedProducts?.length === 1 ? 'товар' : 'товаров'}
          </p>
        </div>

        {!sortedProducts || sortedProducts.length === 0 ? (
          <div className={styles.empty}>
            <p>В этой категории пока нет товаров</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {sortedProducts.map((product) => (
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
