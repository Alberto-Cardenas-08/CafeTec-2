import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { getProducts, localProducts, type Product } from "@/services/products";
import { getSupabase, isSupabaseConfigured } from "@/services/supabase";

export function useMenuProducts(category: string) {
  const [products, setProducts] = useState<Product[]>(() =>
    localProducts.filter((product) => product.category === category),
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    let mounted = true;
    setError(null);
    getProducts(category)
      .then((items) => {
        if (mounted) setProducts(items);
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setError(reason instanceof Error ? `${reason.message} Mostrando el menú local.` : "No se pudo conectar con la API.");
        }
      });
    return () => {
      mounted = false;
    };
  }, [category]);

  useFocusEffect(refresh);

  useEffect(() => {
    if (!isSupabaseConfigured()) return undefined;
    const pull = () => {
      getProducts(category)
        .then(setProducts)
        .catch(() => undefined);
    };
    const channel = getSupabase()
      .channel(`menu-${category}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, pull)
      .subscribe();
    const timer = setInterval(pull, 5000);
    return () => {
      clearInterval(timer);
      getSupabase().removeChannel(channel);
    };
  }, [category]);

  return { products, error };
}
