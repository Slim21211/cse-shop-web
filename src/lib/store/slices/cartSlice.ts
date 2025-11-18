import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Product, CartItem } from '@/types';
import type { RootState } from '../store';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

const initialState: CartState = {
  items: [],
  isOpen: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      const existingItem = state.items.find(
        (item) => item.product.id === action.payload.id
      );

      if (existingItem) {
        existingItem.quantity++;
      } else {
        state.items.push({ product: action.payload, quantity: 1 });
      }
    },

    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(
        (item) => item.product.id !== action.payload
      );
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ productId: number; quantity: number }>
    ) => {
      const item = state.items.find(
        (item) => item.product.id === action.payload.productId
      );
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },

    clearCart: (state) => {
      state.items = [];
    },

    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
} = cartSlice.actions;

// // Selectors
export const selectCartItems = (state: RootState) => state.cart.items;
// export const selectCartTotal = (state: RootState) =>
//   state.cart.items.reduce(
//     (total, item) => total + item.product.price * item.quantity,
//     0
//   );
// export const selectCartItemsCount = (state: RootState) =>
//   state.cart.items.reduce((count, item) => count + item.quantity, 0);
// export const selectIsCartOpen = (state: RootState) => state.cart.isOpen;

export default cartSlice.reducer;
