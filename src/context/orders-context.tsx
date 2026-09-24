import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Alert, AppState } from "react-native";

import { getDeviceId } from "@/services/device";
import { notifyOrderStatus } from "@/services/notifications";
import { getOrdersByDeviceId, getOrdersByIds, isOrder, type Order, type OrderStatus } from "@/services/orders";
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
const SEEN_NOTICES_KEY = "cafetec-seen-notices";

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [lastCustomerName, setLastCustomerNameState] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const ordersRef = useRef<Order[]>([]);
  const seenNotices = useRef(new Set<string>());
  const lastStatus = useRef<Record<string, OrderStatus>>({});
  const statusHydrated = useRef(false);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ORDERS_STORAGE_KEY),
      AsyncStorage.getItem(NAME_STORAGE_KEY),
      AsyncStorage.getItem(SEEN_NOTICES_KEY),
      getDeviceId(),
    ])
      .then(([storedOrders, storedName, storedSeen, id]) => {
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
        if (storedSeen) {
          try {
            const parsed: unknown = JSON.parse(storedSeen);
            if (Array.isArray(parsed)) parsed.forEach((key) => seenNotices.current.add(String(key)));
          } catch {
            seenNotices.current = new Set();
          }
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
    if (!isLoaded) return;
    const fresh: string[] = [];
    const messages: string[] = [];
    for (const order of orders) {
      for (const notice of order.notices ?? []) {
        const key = notice.id || `${order.id}-${notice.productName}-${notice.at}`;
        if (seenNotices.current.has(key)) continue;
        seenNotices.current.add(key);
        fresh.push(key);
        const name = notice.productName;
        messages.push(
          notice.type === "agotado_cancelado"
            ? `${name} se agotó. Como era lo último de tu pedido ${order.id}, se canceló la orden.`
            : `${name} se agotó. El resto de tu pedido ${order.id} sigue en caja.`,
        );
      }
    }
    if (fresh.length) {
      AsyncStorage.setItem(SEEN_NOTICES_KEY, JSON.stringify([...seenNotices.current])).catch(() => undefined);
      Alert.alert("Se agotó un producto", messages.join("\n\n"));
    }

    if (!statusHydrated.current) {
      for (const order of orders) lastStatus.current[order.id] = order.status;
      statusHydrated.current = true;
      return;
    }
    for (const order of orders) {
      const previous = lastStatus.current[order.id];
      lastStatus.current[order.id] = order.status;
      if (!previous || previous === order.status || order.status === "recibido") continue;
      void notifyOrderStatus(order.status, order.id).then((notice) => {
        Alert.alert(notice.title, notice.body);
      });
    }
  }, [isLoaded, orders]);

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
