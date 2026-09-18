import type { ImageSource } from "expo-image";

import catalog from "@/data/products.json";
import { getApiUrl } from "@/services/api";
import { getSupabase, isSupabaseConfigured } from "@/services/supabase";

export type ProductCategory = "hot-drinks" | "cold-drinks" | "frappes" | "lunch";

export type Product = {
  id: string;
  category: ProductCategory;
  name: string;
  description: string;
  price: number;
  image: ImageSource;
  imageUrl?: string;
};

type CatalogProduct = {
  id: string;
  category: ProductCategory;
  name: string;
  description: string;
  price: number;
  imageFile: string;
};

type ApiProduct = {
  id: string;
  category: ProductCategory;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
};

type SupabaseProductRow = {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number | string;
  image_url: string | null;
};

const catalogProducts = catalog as CatalogProduct[];

export const localProducts: Product[] = catalogProducts.map((product) => ({
  id: product.id,
  category: product.category,
  name: product.name,
  description: product.description,
  price: product.price,
  image: getImage(product.imageFile),
}));

function getImage(image: string): ImageSource {
  switch (image) {
    case "01_espresso.png": return require("@/assets/images/01_espresso.png");
    case "02_americano_corazon.png": return require("@/assets/images/02_americano_corazon.png");
    case "03_capuchino.png": return require("@/assets/images/03_capuchino.png");
    case "04_latte.png": return require("@/assets/images/04_latte.png");
    case "05_chocolate_caliente.png": return require("@/assets/images/05_chocolate_caliente.png");
    case "1-iced-coffe.png": return require("@/assets/images/1-iced-coffe.png");
    case "2-iced-latte.png": return require("@/assets/images/2-iced-latte.png");
    case "3-te-helado.png": return require("@/assets/images/3-te-helado.png");
    case "4-limonada-frutos-rojos.png": return require("@/assets/images/4-limonada-frutos-rojos.png");
    case "5-limonada-natural.png": return require("@/assets/images/5-limonada-natural.png");
    case "001-Frappe-Caramelo.png": return require("@/assets/images/001-Frappe-Caramelo.png");
    case "002-Frappe-Mocha.png": return require("@/assets/images/002-Frappe-Mocha.png");
    case "003-Frappe-Vainilla.png": return require("@/assets/images/003-Frappe-Vainilla.png");
    case "004-Frappe-Cookies-And-Cream.png": return require("@/assets/images/004-Frappe-Cookies-And-Cream.png");
    case "005-Frappe-Chocolate.png": return require("@/assets/images/005-Frappe-Chocolate.png");
    case "0001-Club-Sandwich.png": return require("@/assets/images/0001-Club-Sandwich.png");
    case "0002-baguette-de-Pollo.png": return require("@/assets/images/0002-baguette-de-Pollo.png");
    case "0003-Croissant.png": return require("@/assets/images/0003-Croissant.png");
    case "0004-Wrap-Vegetariano.png": return require("@/assets/images/0004-Wrap-Vegetariano.png");
    case "0005-Ensalada-Cesar.png": return require("@/assets/images/0005-Ensalada-Cesar.png");
    default: return require("@/assets/images/0001-Club-Sandwich.png");
  }
}

function mapProduct(item: ApiProduct): Product {
  return {
    ...item,
    category: item.category as ProductCategory,
    price: Number(item.price),
    image: item.imageUrl ? { uri: item.imageUrl } : getFallbackImage(item.id),
  };
}

async function getProductsFromSupabase(category?: ProductCategory): Promise<Product[]> {
  let query = getSupabase().from("products").select("id, category, name, description, price, image_url").order("name");
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: SupabaseProductRow) =>
    mapProduct({
      id: row.id,
      category: row.category as ProductCategory,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      imageUrl: row.image_url || undefined,
    }),
  );
}

export async function getProducts(category: ProductCategory): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    return getProductsFromSupabase(category);
  }

  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/products?category=${category}`);
  if (!response.ok) {
    throw new Error(`La API respondió con el estado ${response.status}.`);
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("La API devolvió un formato de productos inválido.");
  }

  return data.map((item) => {
    if (!isApiProduct(item)) {
      throw new Error("La API devolvió un producto inválido.");
    }
    return mapProduct(item);
  });
}

export function getProductImage(productId: string): ImageSource {
  return localProducts.find((product) => product.id === productId)?.image ??
    localProducts[0].image;
}

function getFallbackImage(productId: string): ImageSource {
  return getProductImage(productId);
}

function isApiProduct(value: unknown): value is ApiProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Record<string, unknown>;
  return typeof product.id === "string" &&
    typeof product.category === "string" &&
    typeof product.name === "string" &&
    typeof product.description === "string" &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    (product.imageUrl === undefined || typeof product.imageUrl === "string");
}
