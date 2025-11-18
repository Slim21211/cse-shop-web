import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { productsApi } from './api/productsApi';
import { authApi } from './api/authApi';
import cartReducer from './slices/cartSlice';
import userReducer from './slices/userSlice';

export function makeStore() {
  const store = configureStore({
    reducer: {
      [productsApi.reducerPath]: productsApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
      cart: cartReducer,
      user: userReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(productsApi.middleware, authApi.middleware),
  });

  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
