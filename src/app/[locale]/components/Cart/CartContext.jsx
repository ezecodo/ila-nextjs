"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const STORAGE_KEY = "ila_cart_v1";

/** @type {import('react').Context<any>} */
const CartContext = createContext(null);

function readStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((it) => it && it.id != null && (it.type === "normal" || it.type === "offer"))
      .map((it) => ({ id: it.id, type: it.type, qty: Math.max(1, Number(it.qty) || 1) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // Cargar desde localStorage al montar (evita mismatch de hidratación)
  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
  }, []);

  // Persistir y sincronizar entre pestañas
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage lleno o no disponible: ignorar */
    }
  }, [items, hydrated]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addToCart = useCallback((id, type = "normal", qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.id === id && it.type === type);
      if (existing) {
        return prev.map((it) =>
          it.id === id && it.type === type ? { ...it, qty: it.qty + qty } : it,
        );
      }
      return [...prev, { id, type, qty: Math.max(1, qty) }];
    });
  }, []);

  const setQty = useCallback((id, type, qty) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((it) => !(it.id === id && it.type === type));
      return prev.map((it) =>
        it.id === id && it.type === type ? { ...it, qty } : it,
      );
    });
  }, []);

  const removeFromCart = useCallback((id, type) => {
    setItems((prev) => prev.filter((it) => !(it.id === id && it.type === type)));
  }, []);

  // Reemplaza el carrito completo (usado por el form para sincronizar cantidades)
  const replaceCart = useCallback((nextItems) => {
    setItems(
      (nextItems || [])
        .filter((it) => it && it.id != null && it.qty > 0)
        .map((it) => ({ id: it.id, type: it.type, qty: it.qty })),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (id, type) => items.some((it) => it.id === id && it.type === type),
    [items],
  );

  const totalCount = useMemo(
    () => items.reduce((sum, it) => sum + it.qty, 0),
    [items],
  );

  const offerCount = useMemo(
    () => items.filter((it) => it.type === "offer").reduce((s, it) => s + it.qty, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      hydrated,
      addToCart,
      setQty,
      removeFromCart,
      replaceCart,
      clearCart,
      isInCart,
      totalCount,
      offerCount,
    }),
    [items, hydrated, addToCart, setQty, removeFromCart, replaceCart, clearCart, isInCart, totalCount, offerCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de <CartProvider>");
  }
  return ctx;
}
