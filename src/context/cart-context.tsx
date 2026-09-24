import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ImageSource } from "expo-image";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getProductImage } from "@/services/products";

export const CART_LIMIT = 3;

export type CartProduct = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  image: ImageSource;
  imageUrl?: string;
  available?: boolean;
};

export type CartItem = CartProduct & {
  quantity: number;
};

type StoredCartItem = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  quantity: number;
  imageUrl?: string;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addProduct: (product: CartProduct) => boolean;
  incrementProduct: (id: string) => boolean;
  decrementProduct: (id: string) => void;
  removeProduct: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = "cafetec-cart";

export function parsePrice(value: number | string): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function quantityOf(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalItems = quantityOf(items);
  const totalPrice = items.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0);

  const showNotification = (message: string) => {
    setNotification(message);
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
    notificationTimer.current = setTimeout(() => setNotification(null), 2800);
  };

  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            const parsed: unknown = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              const limitedItems: CartItem[] = [];
              for (const value of parsed) {
                const item = hydrateCartItem(value);
                if (!item) continue;
                if (quantityOf(limitedItems) + item.quantity > CART_LIMIT) break;
                limitedItems.push(item);
              }
              setItems(limitedItems);
            }
          } catch (error: unknown) {
            console.warn("No se pudo leer el carrito guardado.", error);
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
    const payload: StoredCartItem[] = items.map(({ id, name, description, price, quantity, imageUrl }) => ({
      id,
      name,
      description,
      price,
      quantity,
      imageUrl,
    }));
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload)).catch((error: unknown) => {
      console.warn("No se pudo guardar el carrito; se conservará mientras la app esté abierta.", error);
      setStorageAvailable(false);
    });
  }, [isLoaded, items, storageAvailable]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    totalItems,
    totalPrice,
    addProduct: (product) => {
      if (product.available === false) return false;
      let added = false;
      setItems((current) => {
        const total = quantityOf(current);
        if (total >= CART_LIMIT) return current;
        added = true;
        const existing = current.find((item) => item.id === product.id);
        if (existing) {
          return current.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [...current, { ...product, quantity: 1 }];
      });
      if (added) {
        showNotification(`Agregaste ${product.name}.`);
      }
      return added;
    },
    incrementProduct: (id) => {
      let added = false;
      setItems((current) => {
        if (quantityOf(current) >= CART_LIMIT) return current;
        const existing = current.find((item) => item.id === id);
        if (!existing) return current;
        added = true;
        return current.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      });
      return added;
    },
    decrementProduct: (id) => {
      setItems((current) =>
        current
          .map((item) => item.id === id ? { ...item, quantity: item.quantity - 1 } : item)
          .filter((item) => item.quantity > 0),
      );
    },
    removeProduct: (id) => {
      setItems((current) => current.filter((item) => item.id !== id));
    },
    clearCart: () => setItems([]),
  }), [items, totalItems, totalPrice]);

  useEffect(() => () => {
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
  }, []);

  return (
    <CartContext.Provider value={value}>
      {children}
      {notification && (
        <View pointerEvents="none" style={styles.notificationContainer}>
          <View style={styles.notification}>
            <Ionicons name="checkmark-circle" size={22} color="#fffaf5" />
            <Text style={styles.notificationText}>{notification}</Text>
          </View>
        </View>
      )}
    </CartContext.Provider>
  );
}

const styles = StyleSheet.create({
  notificationContainer: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 92,
    alignItems: "center",
  },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: 520,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#57301c",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  notificationText: {
    flexShrink: 1,
    color: "#fffaf5",
    fontSize: 14,
    fontWeight: "600",
  },
});

function hydrateCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.name !== "string" ||
    typeof item.description !== "string" ||
    !(typeof item.price === "number" || typeof item.price === "string") ||
    typeof item.quantity !== "number" ||
    !Number.isInteger(item.quantity) ||
    item.quantity <= 0
  ) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    quantity: item.quantity,
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : undefined,
    image: typeof item.imageUrl === "string" ? { uri: item.imageUrl } : getProductImage(item.id),
  };
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider.");
  return context;
}
