'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import styles from './Header.module.scss';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>КСЭ</span>
          <span className={styles.logoSubtext}>Магазин подарков</span>
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
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className={styles.iconButton}
              aria-label="Переключить тему"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          )}

          {/* Cart */}
          <Link href="/cart" className={styles.iconButton}>
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

          {/* Mobile Menu Toggle */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={styles.iconButton}
              aria-label="Меню"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <nav className={styles.mobileNav}>
          <Link
            href="/catalog/merch"
            className={styles.mobileNavLink}
            onClick={() => setMobileMenuOpen(false)}
          >
            Мерч компании
          </Link>
          <Link
            href="/catalog/gifts"
            className={styles.mobileNavLink}
            onClick={() => setMobileMenuOpen(false)}
          >
            Подарки отдела
          </Link>
        </nav>
      )}
    </header>
  );
}
