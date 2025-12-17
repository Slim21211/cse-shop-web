'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Loader2 } from 'lucide-react';
import type { Product } from '@/types';
import styles from './productCard.module.scss';
import { ImageCarousel } from '@/components/imageCarousel/imageCarousel';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  isInCart?: boolean;
}

// Функция для склонения слова "балл"
function pluralizePoints(count: number): string {
  const cases = [2, 0, 1, 1, 1, 2];
  const titles = ['балл', 'балла', 'баллов'];
  return titles[
    count % 100 > 4 && count % 100 < 20
      ? 2
      : cases[count % 10 < 5 ? count % 10 : 5]
  ];
}

// Функция для получения массива изображений
function getProductImages(product: Product): string[] {
  // Приоритет: image_urls -> image_url -> пустой массив
  if (product.image_urls && product.image_urls.length > 0) {
    return product.image_urls;
  }
  if (product.image_url) {
    return [product.image_url];
  }
  return [];
}

export function ProductCard({
  product,
  onAddToCart,
  isInCart,
}: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const isOutOfStock = product.remains === 0;
  const hasDiscount = !!product.old_price && product.old_price > product.price;
  const images = getProductImages(product);

  const handleAddToCart = async () => {
    if (!onAddToCart || isInCart || isAdding) return;

    setIsAdding(true);
    try {
      await onAddToCart(product);
    } finally {
      // Небольшая задержка для визуальной обратной связи
      setTimeout(() => setIsAdding(false), 300);
    }
  };

  return (
    <div className={styles.card}>
      <Link href="" className={styles.carouselLink}>
        <ImageCarousel
          images={images}
          alt={product.name}
          discountBadge={
            hasDiscount ? (
              <div className={styles.discountBadge}>
                -
                {Math.round(
                  ((product.old_price! - product.price) / product.old_price!) *
                    100
                )}
                %
              </div>
            ) : undefined
          }
          outOfStockOverlay={
            isOutOfStock ? (
              <div className={styles.outOfStock}>
                <span>Появится в феврале</span>
              </div>
            ) : undefined
          }
        />
      </Link>

      <div className={styles.content}>
        <Link href="" className={styles.name}>
          {product.name}
        </Link>

        {product.description && (
          <p className={styles.description}>{product.description}</p>
        )}

        {product.size && <p className={styles.size}>Размер: {product.size}</p>}

        <div className={styles.footer}>
          <div className={styles.priceInfo}>
            <span className={styles.price}>{product.price}</span>
            {hasDiscount && (
              <span className={styles.oldPrice}>{product.old_price}</span>
            )}
            <span className={styles.currency}>
              {pluralizePoints(product.price)}
            </span>
          </div>

          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className={`${styles.cartButton} ${
                isInCart ? styles.inCart : ''
              } ${isAdding ? styles.adding : ''}`}
              disabled={isInCart || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Добавление...
                </>
              ) : isInCart ? (
                <>
                  <ShoppingCart size={18} />В корзине
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />В корзину
                </>
              )}
            </button>
          )}
        </div>

        {product.remains > 0 && product.remains <= 5 && (
          <p className={styles.lowStock}>Осталось: {product.remains} шт.</p>
        )}
      </div>
    </div>
  );
}
