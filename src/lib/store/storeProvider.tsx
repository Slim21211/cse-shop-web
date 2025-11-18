/* eslint-disable react-hooks/globals */
'use client';

import { Provider } from 'react-redux';
import { makeStore, AppStore } from './store';
import { ReactNode } from 'react';

let clientStore: AppStore | null = null;

export function StoreProvider({ children }: { children: ReactNode }) {
  if (typeof window === 'undefined') {
    // Сервер: создаём новый store на каждый запрос
    return <Provider store={makeStore()}>{children}</Provider>;
  }

  if (!clientStore) {
    clientStore = makeStore();
  }

  return <Provider store={clientStore}>{children}</Provider>;
}
