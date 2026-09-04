import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useEffect } from "react";
import type { ImageSource } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CART_LIMIT = 2;

export type CartProduct = {
  name: string;
  description: string;
  price: number | string;
  image: ImageSource;
  imageUrl?: string;
};

export type CartItem = CartProduct & {
  id: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  addProduct: (product: CartProduct) => boolean;
  removeProduct: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = "cafetec-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const validItems = parsed.filter(isCartItem);
            const limitedItems: CartItem[] = [];
            for (const item of validItems) {
              if (limitedItems.reduce((total, current) => total + current.quantity, 0) + item.quantity > CART_LIMIT) break;
              limitedItems.push(item);
            }
            setItems(limitedItems);
          }
        }
        setIsLoaded(true);
      })
      .catch((error: unknown) => {
        console.warn("El almacenamiento del dispositivo no está disponible; el carrito será temporal.", error);
        setStorageAvailable(false);
        setIsLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!isLoaded || !storageAvailable) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch((error: unknown) => {
      console.warn("No se pudo guardar el carrito; se conservará mientras la app esté abierta.", error);
      setStorageAvailable(false);
    });
  }, [isLoaded, items, storageAvailable]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    totalItems,
    addProduct: (product) => {
      if (totalItems >= CART_LIMIT) return false;
      const id = product.name;
      setItems((current) => {
        const existing = current.find((item) => item.id === id);
        if (existing) {
          return current.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [...current, { ...product, id, quantity: 1 }];
      });
      return true;
    },
    removeProduct: (id) => {
      setItems((current) =>
        current
          .map((item) => item.id === id ? { ...item, quantity: item.quantity - 1 } : item)
          .filter((item) => item.quantity > 0),
      );
    },
    clearCart: () => setItems([]),
  }), [items, totalItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.description === "string" &&
    (typeof item.price === "number" || typeof item.price === "string") &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    "image" in item;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider.");
  return context;
}
