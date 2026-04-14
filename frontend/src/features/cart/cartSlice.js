import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  subtotal: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existingItem = state.items.find((i) => i.product_id === item.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.line_total = existingItem.quantity * existingItem.unit_price;
      } else {
        state.items.push({
          product_id: item.id,
          name: item.name,
          image_url: item.image_url || '',
          quantity: 1,
          unit_price: item.price,
          line_total: item.price,
        });
      }
      state.subtotal = state.items.reduce((acc, curr) => acc + curr.line_total, 0);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.product_id !== action.payload);
      state.subtotal = state.items.reduce((acc, curr) => acc + curr.line_total, 0);
    },
    setQuantity: (state, action) => {
      const { product_id, quantity } = action.payload;
      const existingItem = state.items.find((i) => i.product_id === product_id);
      if (existingItem && quantity > 0) {
        existingItem.quantity = quantity;
        existingItem.line_total = existingItem.quantity * existingItem.unit_price;
      }
      state.subtotal = state.items.reduce((acc, curr) => acc + curr.line_total, 0);
    }
  },
});

export const { addToCart, removeFromCart, setQuantity } = cartSlice.actions;
export default cartSlice.reducer;
