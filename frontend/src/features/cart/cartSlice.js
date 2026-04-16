import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  subtotal: 0,
};

const normalizeId = (value) => String(value);
const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const productId = normalizeId(item.id);
      const unitPrice = toNumber(item.price);
      const quantityToAdd = Math.max(1, toNumber(item.quantity, 1));
      const existingItem = state.items.find((i) => normalizeId(i.product_id) === productId);
      
      if (existingItem) {
        existingItem.quantity += quantityToAdd;
        existingItem.line_total = existingItem.quantity * toNumber(existingItem.unit_price);
      } else {
        state.items.push({
          product_id: productId,
          name: item.name,
          image_url: item.image_url || '',
          quantity: quantityToAdd,
          unit_price: unitPrice,
          line_total: quantityToAdd * unitPrice,
        });
      }
      state.subtotal = state.items.reduce((acc, curr) => acc + toNumber(curr.line_total), 0);
    },
    removeFromCart: (state, action) => {
      const targetId = normalizeId(action.payload);
      state.items = state.items.filter((i) => normalizeId(i.product_id) !== targetId);
      state.subtotal = state.items.reduce((acc, curr) => acc + toNumber(curr.line_total), 0);
    },
    setQuantity: (state, action) => {
      const { product_id, quantity } = action.payload;
      const targetId = normalizeId(product_id);
      const nextQuantity = toNumber(quantity);
      const existingItem = state.items.find((i) => normalizeId(i.product_id) === targetId);
      if (existingItem && nextQuantity > 0) {
        existingItem.quantity = nextQuantity;
        existingItem.line_total = existingItem.quantity * toNumber(existingItem.unit_price);
      }
      state.subtotal = state.items.reduce((acc, curr) => acc + toNumber(curr.line_total), 0);
    }
  },
});

export const { addToCart, removeFromCart, setQuantity } = cartSlice.actions;
export default cartSlice.reducer;
