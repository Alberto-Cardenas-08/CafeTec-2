import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { getCafeOpen, isSupabaseConfigured } from "@/services/cafe";
import { getSupabase } from "@/services/supabase";

type CafeContextValue = {
  isOpen: boolean;
  ready: boolean;
};

const CafeContext = createContext<CafeContextValue | null>(null);

export function CafeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    getCafeOpen()
      .then((open) => {
        if (active) setIsOpen(open);
      })
      .catch(() => {
        if (active) setIsOpen(true);
      })
      .finally(() => {
        if (active) setReady(true);
      });

    if (!isSupabaseConfigured()) return undefined;
    const refresh = () => {
      getCafeOpen()
        .then((open) => {
          if (active) setIsOpen(open);
        })
        .catch(() => undefined);
    };
    const channel = getSupabase()
      .channel("cafe-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cafe_settings" },
        (payload) => {
          const next = payload.new as { is_open?: boolean } | null;
          if (typeof next?.is_open === "boolean") setIsOpen(next.is_open);
          else refresh();
        },
      )
      .subscribe();
    const timer = setInterval(refresh, 5000);
    const app = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });

    return () => {
      active = false;
      clearInterval(timer);
      app.remove();
      getSupabase().removeChannel(channel);
    };
  }, []);

  const value = useMemo(() => ({ isOpen, ready }), [isOpen, ready]);
  return <CafeContext.Provider value={value}>{children}</CafeContext.Provider>;
}

export function useCafe() {
  const context = useContext(CafeContext);
  if (!context) throw new Error("useCafe debe usarse dentro de CafeProvider.");
  return context;
}
