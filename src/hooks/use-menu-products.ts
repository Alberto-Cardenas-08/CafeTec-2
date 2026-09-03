import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getProducts, localProducts, type Product, type ProductCategory } from "@/services/products";

export function useMenuProducts(category: ProductCategory) {
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

  return { products, error };
}
