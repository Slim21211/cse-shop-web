'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './imageCarousel.module.scss';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  discountBadge?: React.ReactNode;
  outOfStockOverlay?: React.ReactNode;
}

export function ImageCarousel({
  images,
  alt,
  discountBadge,
  outOfStockOverlay,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    // Фолбэк на placeholder если нет изображений
    return (
      <div className={styles.carousel}>
        <div className={styles.imageWrapper}>
          {discountBadge}
          <Image
            src="/placeholder.png"
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={styles.image}
          />
          {outOfStockOverlay}
        </div>
      </div>
    );
  }

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.imageWrapper}>
        {discountBadge}

        <Image
          src={images[currentIndex]}
          alt={`${alt} - изображение ${currentIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.image}
        />

        {outOfStockOverlay}

        {/* Стрелки навигации (только если больше 1 изображения) */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className={`${styles.arrow} ${styles.arrowLeft}`}
              aria-label="Предыдущее изображение"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className={`${styles.arrow} ${styles.arrowRight}`}
              aria-label="Следующее изображение"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Индикаторы (точки) - только если больше 1 изображения */}
      {images.length > 1 && (
        <div className={styles.indicators}>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToSlide(index, e)}
              className={`${styles.indicator} ${
                index === currentIndex ? styles.indicatorActive : ''
              }`}
              aria-label={`Перейти к изображению ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
