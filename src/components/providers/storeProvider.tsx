/* eslint-disable react-hooks/globals */
'use client';

import { Provider } from 'react-redux';
import { makeStore, AppStore } from '@/lib/store/store';
import { ReactNode } from 'react';

let clientStore: AppStore | null = null;

export function StoreProvider({ children }: { children: ReactNode }) {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    // SSR: новый стор для каждого рендера
    const serverStore = makeStore();
    return <Provider store={serverStore}>{children}</Provider>;
  }

  // Client: singleton
  if (!clientStore) {
    clientStore = makeStore();
  }

  return <Provider store={clientStore}>{children}</Provider>;
}
