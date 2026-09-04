import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCart } from "@/context/cart-context";

const categories = [
  {
    title: "Bebidas\nCalientes",
    image: require("@/assets/images/Bebida-caliente.png"),
    iconType: "MaterialCommunityIcons",
    iconName: "coffee-outline",
    color: "#57301c",
    route: "/bebidas-calientes",
  },
  {
    title: "Bebidas\nFrías",
    image: require("@/assets/images/Bebidas-frias.png"),
    iconType: "MaterialCommunityIcons",
    iconName: "cup-water",
    color: "#d07f30",
    route: "/bebidas-frias",
  },
  {
    title: "Frappes",
    image: require("@/assets/images/Frappes.png"),
    iconType: "MaterialCommunityIcons",
    iconName: "cup-outline",
    color: "#dfb887",
    route: "/frappes",
  },
  {
    title: "Lunch",
    image: require("@/assets/images/Lunch.png"),
    iconType: "Ionicons",
    iconName: "fast-food-outline",
    color: "#57301c",
    route: "/lunch",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { totalItems } = useCart();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* =========================
              LOGO
              ========================= */}

          <View style={styles.logoWrap}>
            <Image
              source={require("@/assets/images/cafetecTrasnsparentepng.png")}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="Cafetec logo"
            />
          </View>

          {/* =========================
              TÍTULO
              ========================= */}

          <View style={styles.titleRow}>
            <ThemedText type="title" style={styles.title}>
              Menú
            </ThemedText>

            <Pressable
              onPress={() => router.push("/carrito" as never)}
              style={({ pressed }) => [
                styles.cartButton,
                pressed && styles.pressed,
              ]}
              accessibilityLabel={`Ver carrito, ${totalItems} productos`}
            >
              <Ionicons name="cart-outline" size={27} color="#fffaf5" />
              {totalItems > 0 && (
                <View style={styles.cartBadge}>
                  <ThemedText style={styles.cartBadgeText}>{totalItems}</ThemedText>
                </View>
              )}
            </Pressable>
          </View>

          <ThemedText style={styles.intro}>
            Elige tu categoría y descubre{"\n"}tus favoritos
          </ThemedText>

          {/* =========================
              CATEGORÍAS
              ========================= */}

          <View style={styles.categories}>
            {categories.map((category) => (
              <Pressable
                key={category.title}
                onPress={() => router.push(category.route as never)}
                style={({ pressed }) => [
                  styles.category,
                  {
                    backgroundColor: category.color,
                  },
                  pressed && styles.pressed,
                ]}
              >
                {/* =========================
                    IMAGEN DEL PRODUCTO
                    ========================= */}

                <Image
                  source={category.image}
                  style={styles.categoryImage}
                  contentFit="contain"
                />

                {/* =========================
                    ICONO CIRCULAR
                    ========================= */}

                <View style={styles.categoryIcon}>
                  {category.iconType === "Ionicons" ? (
                    <Ionicons
                      name={category.iconName as any}
                      size={32}
                      color="#fffaf5"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={category.iconName as any}
                      size={32}
                      color="#fffaf5"
                    />
                  )}
                </View>

                {/* =========================
                    TEXTO
                    ========================= */}

                <View style={styles.categoryCopy}>
                  <ThemedText style={styles.categoryTitle}>
                    {category.title}
                  </ThemedText>
                </View>

                {/* =========================
                    FLECHA
                    ========================= */}

                <View style={styles.arrowContainer}>
                  <Ionicons
                    name="chevron-forward"
                    size={28}
                    color={category.color}
                  />
                </View>
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
     CONTENEDOR PRINCIPAL
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
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 30,
  },

  /* =========================
     LOGO
     ========================= */

  logoWrap: {
    width: "100%",
    height: 190,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 0,
  },

  logo: {
    width: 500,
    height: 200,
  },

  /* =========================
     TÍTULO
     ========================= */

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  title: {
    color: "#24150e",

    fontSize: 34,
    lineHeight: 40,

    fontWeight: "700",

    marginBottom: 0,
  },

  cartButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#57301c",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: "#d07f30",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fbf6ef",
  },

  cartBadgeText: {
    color: "#fffaf5",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
  },

  intro: {
    color: "#6f594a",

    fontSize: 18,
    lineHeight: 26,

    marginBottom: 14,
  },

  /* =========================
     LISTA DE CATEGORÍAS
     ========================= */

  categories: {
    gap: 14,
  },

  /* =========================
     TARJETA
     ========================= */

  category: {
    width: "100%",
    height: 110,

    borderRadius: 18,

    flexDirection: "row",
    alignItems: "center",

    overflow: "hidden",

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 7,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  /* =========================
     IMAGEN
     ========================= */

  categoryImage: {
    width: 125,
    height: 110,

    marginLeft: 0,
    marginRight: 4,
  },

  /* =========================
     ICONO
     ========================= */

  categoryIcon: {
    width: 64,
    height: 64,

    borderRadius: 32,

    borderWidth: 1.5,
    borderColor: "#fffaf5",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 14,
  },

  /* =========================
     TEXTO DE LA CATEGORÍA
     ========================= */

  categoryCopy: {
    flex: 1,

    justifyContent: "center",
  },

  categoryTitle: {
    color: "#fffaf5",

    fontSize: 23,
    lineHeight: 27,

    fontWeight: "600",
  },

  /* =========================
     BOTÓN FLECHA
     ========================= */

  arrowContainer: {
    width: 45,
    height: 45,

    borderRadius: 23,

    backgroundColor: "#fffaf5",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 16,
  },

  /* =========================
     EFECTO AL PRESIONAR
     ========================= */

  pressed: {
    opacity: 0.8,
  },
});
