import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const cartStorageKey = user ? `sellbooks_cart_${user._id}` : null;
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!cartStorageKey) {
      setItems([]);
      return;
    }
    setItems(JSON.parse(localStorage.getItem(cartStorageKey) || "[]"));
  }, [cartStorageKey]);

  const persist = (nextItems) => {
    setItems(nextItems);
    if (cartStorageKey) localStorage.setItem(cartStorageKey, JSON.stringify(nextItems));
  };

  const addToCart = (product) => {
    const exists = items.find((item) => item._id === product._id);
    const nextItems = exists
      ? items.map((item) => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, { ...product, quantity: 1 }];

    persist(nextItems);
  };

  const updateQuantity = (id, quantity) => {
    const nextItems = items
      .map((item) => item._id === id ? { ...item, quantity: Math.max(1, quantity) } : item)
      .filter((item) => item.quantity > 0);

    persist(nextItems);
  };

  const removeFromCart = (id) => persist(items.filter((item) => item._id !== id));
  const clearCart = () => persist([]);
  const resetCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(
    () => ({ items, addToCart, updateQuantity, removeFromCart, clearCart, resetCart, total }),
    [items, total, cartStorageKey]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
