import type { ImageSource } from "expo-image";

import { getSupabase, isSupabaseConfigured } from "@/services/supabase";

export type MenuCategory = {
  id: string;
  name: string;
  description: string;
  color: string;
  imageUrl?: string;
  image: ImageSource;
  sortOrder: number;
};

const LOCAL_IMAGES: Record<string, ImageSource> = {
  "hot-drinks": require("@/assets/images/Bebida-caliente.png"),
  "cold-drinks": require("@/assets/images/Bebidas-frias.png"),
  frappes: require("@/assets/images/Frappes.png"),
  lunch: require("@/assets/images/Lunch.png"),
};

export const FALLBACK_CATEGORIES: MenuCategory[] = [
  {
    id: "hot-drinks",
    name: "Bebidas Calientes",
    description: "Deliciosas y preparadas con los mejores granos",
    color: "#57301c",
    image: LOCAL_IMAGES["hot-drinks"],
    sortOrder: 1,
  },
  {
    id: "cold-drinks",
    name: "Bebidas Frías",
    description: "Refrescantes y preparadas al momento",
    color: "#d07f30",
    image: LOCAL_IMAGES["cold-drinks"],
    sortOrder: 2,
  },
  {
    id: "frappes",
    name: "Frappes",
    description: "Refrescantes batidos con hielo y mucho sabor",
    color: "#dfb887",
    image: LOCAL_IMAGES.frappes,
    sortOrder: 3,
  },
  {
    id: "lunch",
    name: "Lunch",
    description: "Deliciosas opciones para tu comida del día",
    color: "#57301c",
    image: LOCAL_IMAGES.lunch,
    sortOrder: 4,
  },
];

function categoryImage(id: string, imageUrl?: string | null): ImageSource {
  if (imageUrl) return { uri: imageUrl };
  return LOCAL_IMAGES[id] ?? LOCAL_IMAGES.lunch;
}

export async function getCategories(): Promise<MenuCategory[]> {
  if (!isSupabaseConfigured()) return FALLBACK_CATEGORIES;
  const { data, error } = await getSupabase()
    .from("categories")
    .select("id, name, description, color, image_url, sort_order")
    .order("sort_order")
    .order("name");
  if (error || !data?.length) return FALLBACK_CATEGORIES;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description || "",
    color: row.color || "#57301c",
    imageUrl: row.image_url || undefined,
    image: categoryImage(row.id, row.image_url),
    sortOrder: Number(row.sort_order || 0),
  }));
}

export async function getCategory(id: string): Promise<MenuCategory | null> {
  const all = await getCategories();
  return all.find((item) => item.id === id) ?? null;
}
