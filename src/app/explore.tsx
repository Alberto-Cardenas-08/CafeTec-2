import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const categories = [
  {
    name: "Bebidas Calientes",
    description: "Café, espresso y bebidas calientes.",
    image: require("@/assets/images/Bebida-caliente.png"),
    route: "/bebidas-calientes",
    color: "#57301c",
  },
  {
    name: "Bebidas Frías",
    description: "Refrescantes bebidas preparadas al momento.",
    image: require("@/assets/images/Bebidas-frias.png"),
    route: "/bebidas-frias",
    color: "#d07f30",
  },
  {
    name: "Frappes",
    description: "Café frío, hielo y mucho sabor.",
    image: require("@/assets/images/Frappes.png"),
    route: "/frappes",
    color: "#dfb887",
  },
  {
    name: "Lunch",
    description: "Deliciosas opciones para tu comida.",
    image: require("@/assets/images/Lunch.png"),
    route: "/lunch",
    color: "#57301c",
  },
];

export default function ExploreScreen() {
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
            <View>
              <ThemedText style={styles.title}>Explorar</ThemedText>

              <ThemedText style={styles.subtitle}>
                Descubre todo lo que tenemos para ti
              </ThemedText>
            </View>
          </View>

          {/* MENSAJE DE BIENVENIDA */}
          <View style={styles.welcome}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="cafe" size={28} color="#fffaf5" />
            </View>

            <View style={styles.welcomeText}>
              <ThemedText style={styles.welcomeTitle}>
                ¿Qué se te antoja?
              </ThemedText>

              <ThemedText style={styles.welcomeSubtitle}>
                Elige una categoría y descubre nuestras opciones.
              </ThemedText>
            </View>
          </View>

          {/* CATEGORÍAS */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Categorías</ThemedText>

            <ThemedText style={styles.sectionCount}>
              {categories.length} opciones
            </ThemedText>
          </View>

          <View style={styles.categories}>
            {categories.map((category, index) => (
              <Link key={index} href={category.route as any} asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.category,
                    pressed && styles.categoryPressed,
                  ]}
                >
                  {/* IMAGEN */}
                  <View
                    style={[
                      styles.categoryImageContainer,
                      {
                        backgroundColor: category.color,
                      },
                    ]}
                  >
                    <Image
                      source={category.image}
                      style={styles.categoryImage}
                      contentFit="contain"
                    />
                  </View>

                  {/* INFORMACIÓN */}
                  <View style={styles.categoryInfo}>
                    <ThemedText style={styles.categoryName}>
                      {category.name}
                    </ThemedText>

                    <ThemedText style={styles.categoryDescription}>
                      {category.description}
                    </ThemedText>

                    <View style={styles.viewCategory}>
                      <ThemedText style={styles.viewCategoryText}>
                        Ver productos
                      </ThemedText>

                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#57301c"
                      />
                    </View>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>

          {/* PIE */}
          <View style={styles.footer}>
            <Ionicons name="heart" size={18} color="#d07f30" />

            <ThemedText style={styles.footerText}>
              Hecho con cariño en Cafetec
            </ThemedText>
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
    height: 180,
    marginBottom: 4,
  },

  logo: {
    width: 270,
    height: 170,
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    marginBottom: 20,
  },

  title: {
    color: "#24150e",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 5,
  },

  subtitle: {
    color: "#795e4d",
    fontSize: 15,
    fontWeight: "500",
  },

  /* =========================
     BIENVENIDA
  ========================= */

  welcome: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#57301c",
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },

  welcomeIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255, 250, 245, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  welcomeText: {
    flex: 1,
  },

  welcomeTitle: {
    color: "#fffaf5",
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 4,
  },

  welcomeSubtitle: {
    color: "#e8d9cc",
    fontSize: 13,
    lineHeight: 18,
  },

  /* =========================
     SECCIÓN
  ========================= */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    color: "#24150e",
    fontSize: 21,
    fontWeight: "700",
  },

  sectionCount: {
    color: "#795e4d",
    fontSize: 13,
    fontWeight: "500",
  },

  /* =========================
     CATEGORÍAS
  ========================= */

  categories: {
    gap: 14,
  },

  category: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  categoryPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },

  /* =========================
     IMAGEN CATEGORÍA
  ========================= */

  categoryImageContainer: {
    width: 105,
    height: 105,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 14,
  },

  categoryImage: {
    width: 100,
    height: 100,
  },

  /* =========================
     INFORMACIÓN
  ========================= */

  categoryInfo: {
    flex: 1,
    paddingRight: 4,
  },

  categoryName: {
    color: "#24150e",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
  },

  categoryDescription: {
    color: "#795e4d",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginBottom: 10,
  },

  /* =========================
     VER PRODUCTOS
  ========================= */

  viewCategory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  viewCategoryText: {
    color: "#57301c",
    fontSize: 13,
    fontWeight: "700",
  },

  /* =========================
     FOOTER
  ========================= */

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    gap: 7,
  },

  footerText: {
    color: "#795e4d",
    fontSize: 12,
    fontWeight: "500",
  },
});
