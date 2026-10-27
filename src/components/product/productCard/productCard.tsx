'use client';

import { useState, useRef, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '@/types';
import { pluralizePoints } from '@/lib/format';
import styles from './productCard.module.scss';
import { ImageCarousel } from '@/components/imageCarousel/imageCarousel';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  isInCart?: boolean;
  isPending?: boolean;
  priority?: boolean;
}

// Функция для получения массива изображений
function getProductImages(product: Product): string[] {
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
  isPending,
  priority,
}: ProductCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isOutOfStock = product.remains <= 0;
  const hasDiscount = !!product.old_price && product.old_price > product.price;
  const images = getProductImages(product);

  // Проверяем, обрезан ли текст (если длиннее ~100 символов)
  const isDescriptionTruncated =
    product.description && product.description.length > 100;

  // Закрываем тултип при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (
        tooltipRef.current &&
        wrapperRef.current &&
        !wrapperRef.current.contains(target)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showTooltip]);

  const handleDescriptionClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDescriptionTruncated) {
      e.preventDefault();
      e.stopPropagation();
      setShowTooltip(!showTooltip);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.carouselLink}>
        <ImageCarousel
          images={images}
          alt={product.name}
          priority={priority}
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
                <span>Разобрали</span>
              </div>
            ) : undefined
          }
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{product.name}</h3>

        {/* ✨ Описание с тултипом для десктопа и мобильных */}
        {product.description && (
          <div
            ref={wrapperRef}
            className={styles.descriptionWrapper}
            onMouseEnter={() => isDescriptionTruncated && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={handleDescriptionClick}
            onTouchEnd={handleDescriptionClick}
          >
            <p
              className={`${styles.description} ${
                isDescriptionTruncated ? styles.clickable : ''
              }`}
            >
              {product.description}
            </p>

            {/* Тултип показывается только если текст обрезан */}
            {showTooltip && isDescriptionTruncated && (
              <div ref={tooltipRef} className={styles.tooltip}>
                {product.description}
                <button
                  className={styles.tooltipClose}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTooltip(false);
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

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
              onClick={() => onAddToCart?.(product)}
              className={`${styles.cartButton} ${
                isInCart ? styles.inCart : ''
              }`}
              disabled={isInCart || isPending}
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
