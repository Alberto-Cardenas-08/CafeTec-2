import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const products = [
  {
    name: "Iced Coffee",
    description: "Café frío con hielo.",
    price: "$42",
    image: require("@/assets/images/1-iced-coffe.png"),
  },
  {
    name: "Iced Latte",
    description: "Latte frío con hielo.",
    price: "$45",
    image: require("@/assets/images/2-iced-latte.png"),
  },
  {
    name: "Té Helado",
    description: "Té refrescante con hielo.",
    price: "$35",
    image: require("@/assets/images/3-te-helado.png"),
  },
  {
    name: "Limonada Frutos Rojos",
    description: "Limonada con mezcla de frutos rojos.",
    price: "$38",
    image: require("@/assets/images/4-limonada-frutos-rojos.png"),
  },
  {
    name: "Limonada Natural",
    description: "Limonada clásica y refrescante.",
    price: "$32",
    image: require("@/assets/images/5-limonada-natural.png"),
  },
];

export default function ColdDrinksScreen() {
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
                <Ionicons name="arrow-back" size={34} color="#57301c" />
              </Pressable>
            </Link>

            <ThemedText style={styles.title}>Bebidas Frías</ThemedText>

            {/* Espacio para mantener el título centrado */}
            <View style={styles.headerSpacer} />
          </View>

          {/* BANNER */}
          <View style={styles.description}>
            <View style={styles.descriptionImage}>
              <Image
                source={require("@/assets/images/Bebidas-frias.png")}
                style={styles.descriptionImageInner}
                contentFit="contain"
              />
            </View>

            <View style={styles.descriptionText}>
              <ThemedText style={styles.descriptionTitle}>
                Bebidas Frías
              </ThemedText>

              <ThemedText style={styles.descriptionSubtitle}>
                Refrescantes y preparadas al momento
              </ThemedText>
            </View>
          </View>

          {/* PRODUCTOS */}
          <View style={styles.products}>
            {products.map((product, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.product,
                  pressed && styles.productPressed,
                ]}
              >
                {/* IMAGEN DEL PRODUCTO */}
                <View style={styles.productImageContainer}>
                  <Image
                    source={product.image}
                    style={styles.productImage}
                    contentFit="contain"
                  />
                </View>

                {/* INFORMACIÓN DEL PRODUCTO */}
                <View style={styles.productInfo}>
                  <ThemedText style={styles.productName}>
                    {product.name}
                  </ThemedText>

                  <ThemedText style={styles.productDescription}>
                    {product.description}
                  </ThemedText>

                  <ThemedText style={styles.productPrice}>
                    {product.price}
                  </ThemedText>
                </View>

                {/* BOTÓN + */}
                <Pressable style={styles.addButton}>
                  <Ionicons name="add" size={32} color="#fffaf5" />
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
  /* =========================
     CONTENEDOR
     ========================= */

  container: {
    flex: 1,
    backgroundColor: "#fbf6ef",
  },

  safeArea: {
    flex: 1,
    maxWidth: 560,
    width: "100%",
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
    height: 200,
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

  title: {
    flex: 1,
    color: "#24150e",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  headerSpacer: {
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
    backgroundColor: "#d07f30",
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
     LISTA DE PRODUCTOS
     ========================= */

  products: {
    gap: 14,
  },

  /* =========================
     TARJETA
     ========================= */

  product: {
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

  /* =========================
     IMAGEN DEL PRODUCTO
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
     INFORMACIÓN
     ========================= */

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

  /* =========================
     BOTÓN +
     ========================= */

  addButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#57301c",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
