import type { ImageSource } from "expo-image";
import { Platform } from "react-native";

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

type ApiProduct = Omit<Product, "image"> & { imageUrl?: string };

const productRows: [string, ProductCategory, string, string, number, string][] = [
  ["hot-espresso", "hot-drinks", "Café Espresso", "Café Espresso 100% Arábica, intenso y aromático", 28, "01_espresso.png"],
  ["hot-americano", "hot-drinks", "Americano", "Café Espresso con agua caliente", 32, "02_americano_corazon.png"],
  ["hot-capuchino", "hot-drinks", "Capuchino", "Espresso con leche Espumada", 38, "03_capuchino.png"],
  ["hot-latte", "hot-drinks", "Latte", "Espresso con leche suave y cremosa", 40, "04_latte.png"],
  ["hot-chocolate", "hot-drinks", "Chocolate Caliente", "Chocolate velga con leche", 36, "05_chocolate_caliente.png"],
  ["cold-iced-coffee", "cold-drinks", "Iced Coffee", "Café frío con hielo.", 42, "1-iced-coffe.png"],
  ["cold-iced-latte", "cold-drinks", "Iced Latte", "Latte frío con hielo.", 45, "2-iced-latte.png"],
  ["cold-iced-tea", "cold-drinks", "Té Helado", "Té refrescante con hielo.", 35, "3-te-helado.png"],
  ["cold-red-berry-lemonade", "cold-drinks", "Limonada Frutos Rojos", "Limonada con mezcla de frutos rojos.", 38, "4-limonada-frutos-rojos.png"],
  ["cold-natural-lemonade", "cold-drinks", "Limonada Natural", "Limonada clásica y refrescante.", 32, "5-limonada-natural.png"],
  ["frappe-caramel", "frappes", "Frappe Caramelo", "Café, leche, hielo y caramelo.", 55, "001-Frappe-Caramelo.png"],
  ["frappe-mocha", "frappes", "Frappe Mocha", "Chocolate, café y crema.", 58, "002-Frappe-Mocha.png"],
  ["frappe-vanilla", "frappes", "Frappe Vainilla", "Café con vainilla y crema.", 55, "003-Frappe-Vainilla.png"],
  ["frappe-cookies", "frappes", "Frappe Cookies & Cream", "Café con galleta y crema.", 58, "004-Frappe-Cookies-And-Cream.png"],
  ["frappe-chocolate", "frappes", "Frappe Chocolate", "Chocolate, leche y hielo.", 55, "005-Frappe-Chocolate.png"],
  ["lunch-club-sandwich", "lunch", "Club Sandwich", "Pan tostado, pollo, jamón, queso y vegetales.", 75, "0001-Club-Sandwich.png"],
  ["lunch-baguette-pollo", "lunch", "Baguette de Pollo", "Baguette con pollo, queso y vegetales frescos.", 72, "0002-baguette-de-Pollo.png"],
  ["lunch-croissant", "lunch", "Croissant", "Croissant de mantequilla relleno de jamón y queso.", 55, "0003-Croissant.png"],
  ["lunch-wrap-vegetariano", "lunch", "Wrap Vegetariano", "Lechuga, tomate, queso y vegetales frescos.", 60, "0004-Wrap-Vegetariano.png"],
  ["lunch-ensalada-cesar", "lunch", "Ensalada César", "Lechuga fresca, pollo, queso y aderezo César.", 65, "0005-Ensalada-Cesar.png"],
];

export const localProducts: Product[] = productRows.map(([id, category, name, description, price, image]) => ({
  id,
  category,
  name,
  description,
  price,
  image: getImage(image),
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

const apiUrl = (
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000")
).replace(/\/$/, "");

export async function getProducts(category: ProductCategory): Promise<Product[]> {
  if (!apiUrl) {
    return localProducts.filter((product) => product.category === category);
  }

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
    return {
      ...item,
      image: item.imageUrl ? { uri: item.imageUrl } : getFallbackImage(item.id),
    };
  });
}

function getFallbackImage(productId: string): ImageSource {
  return localProducts.find((product) => product.id === productId)?.image ??
    localProducts[0].image;
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
