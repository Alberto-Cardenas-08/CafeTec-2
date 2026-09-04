import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useMenuProducts } from "@/hooks/use-menu-products";
import { useCart } from "@/context/cart-context";

const products = [
  {
    name: "Café Espresso",
    description: "Café Espresso 100% Arábica, intenso y aromático",
    price: "$28",
    image: require("@/assets/images/01_espresso.png"),
  },
  {
    name: "Americano",
    description: "Café Espresso con agua caliente",
    price: "$32",
    image: require("@/assets/images/02_americano_corazon.png"),
  },
  {
    name: "Capuchino",
    description: "Espresso con leche Espumada",
    price: "$38",
    image: require("@/assets/images/03_capuchino.png"),
  },
  {
    name: "Latte",
    description: "Espresso con leche suave y cremosa",
    price: "$40",
    image: require("@/assets/images/04_latte.png"),
  },
  {
    name: "Chocolate Caliente",
    description: "Chocolate velga con leche",
    price: "$36",
    image: require("@/assets/images/05_chocolate_caliente.png"),
  },
];

export default function HotDrinksScreen() {
  const { products: apiProducts, error: apiError } = useMenuProducts("hot-drinks");
  const { addProduct } = useCart();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* LOGO CAFETEC */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/cafetecTrasnsparentepng.png")}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="Logo Cafetec"
            />
          </View>

          {/* ======================================
              HEADER
          ====================================== */}

          <View style={styles.header}>
            <Link href="/" asChild>
              <Pressable style={styles.backButton}>
                <Ionicons name="arrow-back" size={32} color="#57301c" />
              </Pressable>
            </Link>

            <ThemedText style={styles.headerTitle}>
              Bebidas Calientes
            </ThemedText>

            <View style={styles.headerSpace} />
          </View>

          {/* ======================================
              ENCABEZADO DE CATEGORÍA
          ====================================== */}

          <View style={styles.categoryHeader}>
            {/* Imagen de la categoría */}

            <View style={styles.categoryImageContainer}>
              <Image
                source={require("@/assets/images/Bebida-caliente.png")}
                style={styles.categoryImage}
                contentFit="contain"
              />
            </View>

            {/* Texto */}

            <View style={styles.categoryText}>
              <ThemedText style={styles.categoryTitle}>
                Bebidas Calientes
              </ThemedText>

              <ThemedText style={styles.categoryDescription}>
                Deliciosas y preparadas con los mejores granos
              </ThemedText>
            </View>
          </View>

          {/* ======================================
              PRODUCTOS
          ====================================== */}

          <View style={styles.products}>
            {apiError && <ThemedText style={styles.productDescription}>{apiError}</ThemedText>}
            {(apiProducts.length ? apiProducts : products).map((product) => (
              <Pressable
                key={product.name}
                style={({ pressed }) => [
                  styles.productCard,
                  pressed && styles.productPressed,
                ]}
              >
                {/* IMAGEN */}

                <View style={styles.productImageContainer}>
                  <Image
                    source={"imageUrl" in product && product.imageUrl ? { uri: product.imageUrl } : product.image}
                    style={styles.productImage}
                    contentFit="contain"
                  />
                </View>

                {/* INFORMACIÓN */}

                <View style={styles.productInfo}>
                  <ThemedText style={styles.productName}>
                    {product.name}
                  </ThemedText>

                  <ThemedText style={styles.productDescription}>
                    {product.description}
                  </ThemedText>

                  <ThemedText style={styles.productPrice}>
                    {typeof product.price === "number" ? `$${product.price}` : product.price}
                  </ThemedText>
                </View>

                {/* BOTÓN + */}

                <Pressable
                  style={styles.addButton}
                  onPress={() => {
                    if (!addProduct(product)) {
                      Alert.alert("Carrito lleno", "Solo puedes agregar 2 productos por dispositivo.");
                    }
                  }}
                  accessibilityLabel={`Agregar ${product.name} al carrito`}
                >
                  <Ionicons name="add" size={28} color="#fffaf5" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({
  /* ======================================
     CONTENEDOR
  ====================================== */

  container: {
    flex: 1,
    backgroundColor: "#fbf6ef",
  },

  safeArea: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 40,
  },

  /* ======================================
     LOGO
  ====================================== */

  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    marginBottom: 4,
  },

  logo: {
    width: 280,
    height: 180,
  },

  /* ======================================
     HEADER
  ====================================== */

  header: {
    height: 70,

    flexDirection: "row",
    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 24,
  },

  backButton: {
    width: 50,
    height: 50,

    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,

    textAlign: "center",

    color: "#24150e",

    fontSize: 22,
    fontWeight: "700",
  },

  headerSpace: {
    width: 50,
    height: 50,
  },

  /* ======================================
     ENCABEZADO DE CATEGORÍA
  ====================================== */

  categoryHeader: {
    flexDirection: "row",

    alignItems: "center",

    minHeight: 130,

    backgroundColor: "#57301c",

    borderRadius: 20,

    paddingHorizontal: 18,
    paddingVertical: 14,

    marginBottom: 20,

    overflow: "hidden",
  },

  categoryImageContainer: {
    width: 105,
    height: 105,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,
  },

  categoryImage: {
    width: 105,
    height: 105,
  },

  categoryText: {
    flex: 1,

    justifyContent: "center",
  },

  categoryTitle: {
    color: "#fffaf5",

    fontSize: 21,
    fontWeight: "700",

    marginBottom: 5,
  },

  categoryDescription: {
    color: "#eaded5",

    fontSize: 14,
    lineHeight: 19,

    fontWeight: "500",
  },

  /* ======================================
     PRODUCTOS
  ====================================== */

  products: {
    gap: 14,
  },

  /* ======================================
     TARJETA
  ====================================== */

  productCard: {
    minHeight: 115,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#ffffff",

    borderRadius: 18,

    paddingHorizontal: 12,
    paddingVertical: 12,

    shadowColor: "#000",

    shadowOpacity: 0.1,

    shadowRadius: 5,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  productPressed: {
    opacity: 0.75,
  },

  /* ======================================
     IMAGEN DEL PRODUCTO
  ====================================== */

  productImageContainer: {
    width: 85,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  productImage: {
    width: 90,
    height: 90,
  },

  /* ======================================
     INFORMACIÓN
  ====================================== */

  productInfo: {
    flex: 1,

    justifyContent: "center",

    paddingRight: 4,
  },

  productName: {
    color: "#24150e",

    fontSize: 18,

    lineHeight: 23,

    fontWeight: "700",

    marginBottom: 4,
  },

  productDescription: {
    color: "#795e4d",

    fontSize: 14,

    lineHeight: 19,

    fontWeight: "500",

    marginBottom: 6,
  },

  productPrice: {
    color: "#57301c",

    fontSize: 18,

    fontWeight: "700",
  },

  /* ======================================
     BOTÓN +
  ====================================== */

  addButton: {
    width: 52,
    height: 52,

    borderRadius: 26,

    backgroundColor: "#57301c",

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 8,
  },
});
