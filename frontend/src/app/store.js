import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../features/cart/cartSlice';

const CART_STORAGE_KEY = 'scalercart.cart.v1';

const normalizeStoredCart = (parsed) => {
  if (!parsed || typeof parsed !== 'object') return undefined;
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  const normalizedItems = items
    .map((item) => {
      const productId = item?.product_id ?? item?.id;
      const quantity = Number(item?.quantity);
      const unitPrice = Number(item?.unit_price ?? item?.price);
      if (productId === undefined || productId === null || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice)) {
        return null;
      }
      return {
        product_id: String(productId),
        name: item?.name || '',
        image_url: item?.image_url || '',
        quantity,
        unit_price: unitPrice,
        line_total: quantity * unitPrice,
      };
    })
    .filter(Boolean);

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.line_total, 0);
  return { items: normalizedItems, subtotal };
};

const loadCartState = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    const normalizedCart = normalizeStoredCart(parsed);
    if (!normalizedCart) return undefined;
    return { cart: normalizedCart };
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
