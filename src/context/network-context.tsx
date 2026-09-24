import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";

type NetworkContextValue = {
  online: boolean;
  ready: boolean;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

async function readOnline() {
  if (Platform.OS === "web") {
    return typeof navigator === "undefined" ? true : navigator.onLine;
  }
  try {
    const Network = await import("expo-network");
    const state = await Network.getNetworkStateAsync();
    if (state.isConnected === false) return false;
    if (state.isInternetReachable === false) return false;
    return true;
  } catch {
    return true;
  }
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      readOnline()
        .then((value) => {
          if (active) setOnline(value);
        })
        .finally(() => {
          if (active) setReady(true);
        });
    };
    refresh();
    const timer = setInterval(refresh, 3000);
    const app = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("online", refresh);
      window.addEventListener("offline", refresh);
    }
    return () => {
      active = false;
      clearInterval(timer);
      app.remove();
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.removeEventListener("online", refresh);
        window.removeEventListener("offline", refresh);
      }
    };
  }, []);

  const value = useMemo(() => ({ online, ready }), [online, ready]);
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) throw new Error("useNetwork debe usarse dentro de NetworkProvider.");
  return context;
}
