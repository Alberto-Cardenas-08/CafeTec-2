import { Ionicons } from "@expo/vector-icons";
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useEffect } from "react";
import type { ImageSource } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet, Text, View } from "react-native";

export const CART_LIMIT = 3;

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
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      const remaining = CART_LIMIT - (totalItems + 1);
      setNotification(
        remaining > 0
          ? `Agregaste ${product.name}. Te quedan ${remaining} para alcanzar el máximo.`
          : `Agregaste ${product.name}. Has alcanzado el máximo.`,
      );
      if (notificationTimer.current) clearTimeout(notificationTimer.current);
      notificationTimer.current = setTimeout(() => setNotification(null), 2800);
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
