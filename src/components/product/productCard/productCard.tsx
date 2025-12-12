'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '@/types';
import placeholder from './img/placeholder.png';
import styles from './productCard.module.scss';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  isInCart?: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  isInCart,
}: ProductCardProps) {
  const isOutOfStock = product.remains === 0;

  return (
    <div className={styles.card}>
      <Link href="" className={styles.imageWrapper}>
        <Image
          src={product.image_url || placeholder}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.image}
        />
        {isOutOfStock && (
          <div className={styles.outOfStock}>
            <span>Нет в наличии</span>
          </div>
        )}
      </Link>

      <div className={styles.content}>
        <Link href="" className={styles.name}>
          {product.name}
        </Link>

        {product.size && <p className={styles.size}>Размер: {product.size}</p>}

        <div className={styles.footer}>
          <div className={styles.priceInfo}>
            <span className={styles.price}>{product.price}</span>
            <span className={styles.currency}>баллов</span>
          </div>

          {!isOutOfStock && (
            <button
              onClick={() => onAddToCart?.(product)}
              className={`${styles.cartButton} ${
                isInCart ? styles.inCart : ''
              }`}
              disabled={isInCart}
            >
              <ShoppingCart size={18} />
              {isInCart ? 'В корзине' : 'В корзину'}
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
