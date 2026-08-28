import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

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
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Ionicons name="menu" size={32} color="#4e2918" />
            <Image
              source={require("@/assets/images/cafetecTrasnsparentepng.png")}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="Cafetec logo"
            />
            <View style={styles.cartContainer}>
              <Ionicons name="cart-outline" size={28} color="#4e2918" />
              <View style={styles.cartBadge}>
                <ThemedText style={styles.cartBadgeText}>2</ThemedText>
              </View>
            </View>
          </View>

          {/* TEXTO INTRODUCTORIO */}
          <ThemedText type="title" style={styles.title}>
            Menú
          </ThemedText>
          <ThemedText style={styles.intro}>
            Elige tu categoría y descubre{`\n`}tus favoritos
          </ThemedText>

          {/* CATEGORÍAS */}
          <View style={styles.categories}>
            {categories.map((category) => (
              <Link key={category.title} href={category.route as never} asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.category,
                    { backgroundColor: category.color },
                    pressed && styles.pressed,
                  ]}
                >
                  {/* Imagen del producto */}
                  <Image
                    source={category.image}
                    style={styles.categoryImage}
                    contentFit="contain"
                  />

                  {/* Ícono circular */}
                  <View style={styles.categoryIcon}>
                    {category.iconType === "Ionicons" ? (
                      <Ionicons
                        name={category.iconName as any}
                        size={28}
                        color="#fffaf5"
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={category.iconName as any}
                        size={28}
                        color="#fffaf5"
                      />
                    )}
                  </View>

                  {/* Título */}
                  <View style={styles.categoryCopy}>
                    <ThemedText style={styles.categoryTitle}>
                      {category.title}
                    </ThemedText>
                  </View>

                  {/* Flecha */}
                  <View style={styles.arrowContainer}>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={category.color}
                    />
                  </View>
                </Pressable>
              </Link>
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
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  content: {
    padding: 24,
    paddingBottom: 110,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  logo: {
    width: 160,
    height: 80,
  },
  cartContainer: {
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#d07f30",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  title: {
    color: "#24150e",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  intro: {
    color: "#795e4d",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  categories: {
    gap: 16,
  },
  category: {
    height: 110,
    borderRadius: 20,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  categoryImage: {
    width: 100,
    height: 100,
    marginLeft: 0,
    marginRight: 10,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#fffaf5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryCopy: {
    flex: 1,
    justifyContent: "center",
  },
  categoryTitle: {
    color: "#fffaf5",
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 24,
  },
  arrowContainer: {
    backgroundColor: "#fffaf5",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});
