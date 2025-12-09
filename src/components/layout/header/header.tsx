'use client';

import Link from 'next/link';
import { ShoppingCart, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import styles from './header.module.scss';

interface HeaderProps {
  user?: {
    name: string;
    points: number;
  } | null;
  cartItemsCount?: number;
}

export function Header({ user, cartItemsCount = 0 }: HeaderProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isMobile = useIsMobile();

  // Определяем иконку для темы
  const ThemeIcon = theme === 'light' ? Moon : Sun;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>КСЭ</span>
          {isMobile ? null : (
            <span className={styles.logoSubtext}>Магазин подарков</span>
          )}
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className={styles.nav}>
            <Link href="/catalog/merch" className={styles.navLink}>
              Мерч компании
            </Link>
            <Link href="/catalog/gifts" className={styles.navLink}>
              Подарки отдела
            </Link>
          </nav>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {/* ИСПРАВЛЕНИЕ ГИДРАТАЦИИ: Рендерим <button> всегда. */}
          <button
            // Если mounted === false (на SSR), onClick будет undefined (неактивно)
            onClick={mounted ? toggleTheme : undefined}
            className={styles.iconButton}
            aria-label="Переключить тему"
            title={theme === 'light' ? 'Темная тема' : 'Светлая тема'}
            disabled={!mounted} // Отключаем на сервере
          >
            {/* ИСПРАВЛЕНИЕ: Используем mounted, чтобы рендерить одинаковое содержимое на SSR и клиенте.
               На SSR мы рендерим заглушку, которая сохраняет место, 
               чтобы избежать ошибки несовпадения иконки. 
            */}
            {mounted ? (
              <ThemeIcon size={20} />
            ) : (
              // Рендерим пустой элемент, сохраняющий место, чтобы структура была одинаковой
              <span
                style={{ width: 20, height: 20, display: 'inline-block' }}
              />
            )}
          </button>

          {/* Cart */}
          <Link href="/cart" className={styles.iconButton} title="Корзина">
            <ShoppingCart size={20} />
            {cartItemsCount > 0 && (
              <span className={styles.badge}>{cartItemsCount}</span>
            )}
          </Link>

          {/* User */}
          {user ? (
            <Link href="/account" className={styles.userButton}>
              <User size={20} />
              {!isMobile && (
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userPoints}>
                    {user.points} баллов
                  </span>
                </div>
              )}
            </Link>
          ) : (
            <Link href="/login" className={styles.loginButton}>
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
