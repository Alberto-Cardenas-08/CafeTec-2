import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { getDeviceId } from "@/services/device";
import { getOrdersByDeviceId, getOrdersByIds, isOrder, type Order } from "@/services/orders";
import { getSupabase, isSupabaseConfigured } from "@/services/supabase";

type OrdersContextValue = {
  orders: Order[];
  deviceId: string;
  lastCustomerName: string;
  rememberOrder: (order: Order) => void;
  refreshOrders: () => Promise<void>;
  setLastCustomerName: (name: string) => void;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);
const ORDERS_STORAGE_KEY = "cafetec-my-orders";
const NAME_STORAGE_KEY = "cafetec-customer-name";

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [lastCustomerName, setLastCustomerNameState] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const ordersRef = useRef<Order[]>([]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ORDERS_STORAGE_KEY),
      AsyncStorage.getItem(NAME_STORAGE_KEY),
      getDeviceId(),
    ])
      .then(([storedOrders, storedName, id]) => {
        setDeviceId(id);
        if (storedOrders) {
          try {
            const parsed: unknown = JSON.parse(storedOrders);
            if (Array.isArray(parsed)) {
              setOrders(parsed.filter(isOrder));
            }
          } catch (error: unknown) {
            console.warn("No se pudieron leer los pedidos guardados.", error);
          }
        }
        if (typeof storedName === "string" && storedName.trim()) {
          setLastCustomerNameState(storedName.trim());
        }
        setIsLoaded(true);
      })
      .catch((error: unknown) => {
        console.warn("No se pudo leer el historial de pedidos.", error);
        setIsLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders)).catch((error: unknown) => {
      console.warn("No se pudo guardar el historial de pedidos.", error);
    });
  }, [isLoaded, orders]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(NAME_STORAGE_KEY, lastCustomerName).catch((error: unknown) => {
      console.warn("No se pudo guardar el nombre.", error);
    });
  }, [isLoaded, lastCustomerName]);

  const rememberOrder = useCallback((order: Order) => {
    setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
    if (order.customerName.trim()) {
      setLastCustomerNameState(order.customerName.trim());
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    const byDevice = deviceId ? await getOrdersByDeviceId(deviceId).catch(() => []) : [];
    const ids = ordersRef.current.map((order) => order.id);
    const byIds = ids.length ? await getOrdersByIds(ids) : [];
    const merged = new Map<string, Order>();
    for (const order of [...byIds, ...byDevice]) merged.set(order.id, order);
    if (merged.size === 0) return;
    setOrders(Array.from(merged.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, [deviceId]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !isLoaded) return undefined;
    const pull = () => refreshOrders().catch(() => undefined);
    const channel = getSupabase()
      .channel("my-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        pull,
      )
      .subscribe();
    const timer = setInterval(pull, 4000);
    const app = AppState.addEventListener("change", (next) => {
      if (next === "active") pull();
    });
    return () => {
      clearInterval(timer);
      app.remove();
      getSupabase().removeChannel(channel);
    };
  }, [isLoaded, refreshOrders]);

  const setLastCustomerName = useCallback((name: string) => {
    setLastCustomerNameState(name.trim());
  }, []);

  const value = useMemo<OrdersContextValue>(() => ({
    orders,
    deviceId,
    lastCustomerName,
    rememberOrder,
    refreshOrders,
    setLastCustomerName,
  }), [deviceId, lastCustomerName, orders, refreshOrders, rememberOrder, setLastCustomerName]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error("useOrders debe usarse dentro de OrdersProvider.");
  return context;
}
