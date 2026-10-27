'use client';

import { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';
import styles from './header.module.scss';

export type Theme = 'light' | 'dark';
export const THEME_COOKIE_KEY = 'cse-theme';

// Источник правды — атрибут data-theme на <html>; его выставляет сервер по куке
// (или inline-скрипт по системной теме), поэтому SSR и гидратация совпадают.
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => initialTheme);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE_KEY}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  };

  const ThemeIcon = theme === 'light' ? Moon : Sun;

  return (
    <button
      onClick={toggleTheme}
      className={styles.iconButton}
      aria-label="Переключить тему"
      title={theme === 'light' ? 'Темная тема' : 'Светлая тема'}
    >
      <ThemeIcon size={20} />
    </button>
  );
}
