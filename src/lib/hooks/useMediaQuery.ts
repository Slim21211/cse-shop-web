'use client';

import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {};
      const media = window.matchMedia(query);
      media.addEventListener('change', callback);
      return () => media.removeEventListener('change', callback);
    },
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
    () => false
  );
}

export const useIsMobile = (): boolean => useMediaQuery('(max-width: 768px)');
export const useIsTablet = (): boolean =>
  useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 1025px)');
