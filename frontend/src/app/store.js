import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../features/cart/cartSlice';

const CART_STORAGE_KEY = 'scalercart.cart.v1';

const loadCartState = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return undefined;
    return { cart: parsed };
  } catch {
    return undefined;
  }
};

export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
  preloadedState: loadCartState(),
});

store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  } catch {
    // Ignore write errors (e.g., private mode/storage limits)
  }
});
