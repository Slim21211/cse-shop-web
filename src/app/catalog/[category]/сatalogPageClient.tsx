'use client';

import { useGetProductsQuery } from '@/lib/store/api/productsApi';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { addToCart, selectCartItems } from '@/lib/store/slices/cartSlice';
import type { Product } from '@/types';
import { ProductCard } from '@/components/product/productCard/productCard';
import styles from './page.module.scss';

interface CatalogPageClientProps {
  category: string;
}

export default function CatalogPageClient({
  category,
}: CatalogPageClientProps) {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);

  const { data: products, isLoading, error } = useGetProductsQuery(category);

  const categoryTitle =
    category === 'merch' ? 'Мерч компании' : 'Подарки отдела';

  const handleAddToCart = (product: Product) => {
    dispatch(addToCart(product));
  };

  const isInCart = (productId: number) => {
    return cartItems.some((item) => item.product.id === productId);
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
