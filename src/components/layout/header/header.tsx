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
          {/* ЗАМЕНА: Текстовый логотип заменен на SVG */}
          <svg
            className={styles.logoSvg}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 5400 1457"
            aria-label="Логотип КСЭ"
          >
            <path
              fill="currentColor" // Используем currentColor, чтобы цвет логотипа брался из CSS
              d="M388.53 0L0 1457h357.16L745.23 0zm1570.54 0H1503.2L917.97 464.54l-.2-.33-288.86 229.77 555.18 763h455.9l-555.28-763.12zm3340.18 311.4c6.8-9.53 3.44-21-5-32.41l-223.93-279H3906.58l-85.87 324.4h1448.46c11.38.01 21.74-1.3 30.07-12.99zm-3174.91 794.53c-12.39-17.87-15.5-40.76-9.45-64l165.82-621.18c6.23-24.29 22.58-49.1 46.41-68.2s50.81-28.19 75.17-28.19h1204.74L3693.6-.04H2453.76c-106.74 0-224.87 40.83-327.74 122.92-103.59 82.06-173.35 189.82-201.92 296.6l-165.45 622.55c-28.54 106.16-16.44 212.47 42.64 293.65 58.58 80.93 153.28 121.33 259.09 121.33h1244.53l86.77-324.72H2181.39c-23.31 0-43.93-8.76-57.05-26.36zm3400.37-539.35H3756.6l-85.69 323.83h1770l228.47-143.7zm-595.67 566H3606.76L3520.91 1457h1016.11l416.59-262.37c12.58-7.59 17.36-26.31 11.57-40.23-4.67-11.25-12.58-21.77-36.14-21.77z"
            />
          </svg>

          {isMobile ? null : (
            <span className={styles.logoSubtext}>Магазин подарков</span>
          )}
        </Link>

        {/* Desktop Navigation */}
        {/* ... (остальной код не изменился) ... */}
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
