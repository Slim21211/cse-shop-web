/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { setCookie } from 'cookies-next';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'cse-theme';
const THEME_ATTRIBUTE = 'data-theme';
const isBrowser = typeof window !== 'undefined';

/**
 * Получает начальную тему: из localStorage, затем из предпочтений системы, по умолчанию 'light'.
 */
function getInitialTheme(): Theme {
  if (!isBrowser) return 'light';

  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;

    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    return prefersDark ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Применяет тему к элементу <html>, сохраняет в localStorage И в куки (для SSR).
 */
function applyTheme(theme: Theme) {
  if (!isBrowser) return;

  try {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Сохраняем тему в куки для SSR
    setCookie(STORAGE_KEY, theme, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 год
    });
  } catch (error) {
    console.error('Failed to apply theme:', error);
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Инициализируем mounted на основе isBrowser для избежания ошибок гидратации/линтера
  const [mounted, setMounted] = useState(isBrowser);

  // Эффект для синхронизации темы с DOM и куками при ее изменении.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Отдельный эффект для установки mounted (если нужно):
  useEffect(() => {
    if (!mounted && isBrowser) {
      setMounted(true);
    }
  }, [mounted]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      return prevTheme === 'light' ? 'dark' : 'light';
    });
  }, []);

  const setThemeValue = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme: setThemeValue,
    mounted,
  };
}
