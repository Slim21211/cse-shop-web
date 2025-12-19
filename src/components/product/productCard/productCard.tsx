'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
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
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isOutOfStock = product.remains === 0;
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
      <Link
        href=""
        className={styles.carouselLink}
        onClick={(e) => e.preventDefault()}
      >
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
        <Link
          href=""
          className={styles.name}
          onClick={(e) => e.preventDefault()}
        >
          {product.name}
        </Link>

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
