import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useMenuProducts } from "@/hooks/use-menu-products";
import { useCart } from "@/context/cart-context";

export default function LunchScreen() {
  const { products, error: apiError } = useMenuProducts("lunch");
  const { addProduct } = useCart();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
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

          {/* HEADER */}
          <View style={styles.header}>
            <Link href="/" asChild>
              <Pressable style={styles.backButton}>
                <Ionicons name="arrow-back" size={32} color="#57301c" />
              </Pressable>
            </Link>

            <ThemedText style={styles.title}>Lunch</ThemedText>

            {/* Espacio para mantener el título centrado */}
            <View style={styles.headerSpace} />
          </View>

          {/* BANNER */}
          <View style={styles.description}>
            <View style={styles.descriptionImage}>
              <Image
                source={require("@/assets/images/Lunch.png")}
                style={styles.descriptionImageInner}
                contentFit="contain"
              />
            </View>

            <View style={styles.descriptionText}>
              <ThemedText style={styles.descriptionTitle}>Lunch</ThemedText>

              <ThemedText style={styles.descriptionSubtitle}>
                Deliciosas opciones para tu comida del día
              </ThemedText>
            </View>
          </View>

          {apiError && <ThemedText style={styles.apiError}>{apiError}</ThemedText>}

          {/* PRODUCTOS */}
          <View style={styles.products}>
            {products.map((product) => (
              <Pressable
                key={product.id}
                style={({ pressed }) => [
                  styles.product,
                  pressed && styles.productPressed,
                ]}
              >
                {/* IMAGEN DEL PRODUCTO */}
                <View style={styles.productImageContainer}>
                  <Image
                    source={product.imageUrl ? { uri: product.imageUrl } : product.image}
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
                    ${product.price}
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

const styles = StyleSheet.create({
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

  /* =========================
     LOGO
  ========================= */

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

  /* =========================
     HEADER
  ========================= */

  header: {
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

  title: {
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

  /* =========================
     BANNER
  ========================= */

  description: {
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

  descriptionImage: {
    width: 105,
    height: 105,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  descriptionImageInner: {
    width: 105,
    height: 105,
  },

  descriptionText: {
    flex: 1,
    justifyContent: "center",
  },

  descriptionTitle: {
    color: "#fffaf5",
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 5,
  },

  descriptionSubtitle: {
    color: "#fffaf5",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
  },

  /* =========================
     PRODUCTOS
  ========================= */

  products: {
    gap: 14,
  },

  apiError: {
    color: "#a33a2b",
    fontSize: 13,
    marginBottom: 12,
  },

  product: {
    minHeight: 115,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,

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

  /* =========================
     IMAGEN PRODUCTO
  ========================= */

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

  /* =========================
     INFORMACIÓN PRODUCTO
  ========================= */

  productInfo: {
    flex: 1,
    paddingRight: 4,
  },

  productName: {
    color: "#24150e",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },

  productDescription: {
    color: "#795e4d",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
    marginBottom: 6,
  },

  productPrice: {
    color: "#57301c",
    fontSize: 18,
    fontWeight: "700",
  },

  /* =========================
     BOTÓN +
  ========================= */

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
