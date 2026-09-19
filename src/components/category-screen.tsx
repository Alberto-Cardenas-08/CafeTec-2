import { Ionicons } from "@expo/vector-icons";
import { Image, type ImageSource } from "expo-image";
import { Link } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CafeStatusBanner } from "@/components/cafe-status-banner";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CART_LIMIT, useCart } from "@/context/cart-context";
import { useMenuProducts } from "@/hooks/use-menu-products";

type CategoryScreenProps = {
  category: string;
  title: string;
  description: string;
  color: string;
  bannerImage: ImageSource;
};

export function CategoryScreen({
  category,
  title,
  description,
  color,
  bannerImage,
}: CategoryScreenProps) {
  const { products, error } = useMenuProducts(category);
  const { items, totalItems, addProduct } = useCart();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/cafetecTrasnsparentepng.png")}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="Logo Cafetec"
            />
          </View>

          <View style={styles.header}>
            <Link href="/" asChild>
              <Pressable style={styles.backButton} accessibilityLabel="Volver al menú">
                <Ionicons name="arrow-back" size={32} color="#57301c" />
              </Pressable>
            </Link>
            <ThemedText style={styles.headerTitle}>{title}</ThemedText>
            <View style={styles.headerSpace} />
          </View>

          <View style={[styles.categoryHeader, { backgroundColor: color }]}>
            <View style={styles.categoryImageContainer}>
              <Image source={bannerImage} style={styles.categoryImage} contentFit="contain" />
            </View>
            <View style={styles.categoryText}>
              <ThemedText style={styles.categoryTitle}>{title}</ThemedText>
              <ThemedText style={styles.categoryDescription}>{description}</ThemedText>
            </View>
          </View>

          <CafeStatusBanner />

          {error ? <ThemedText style={styles.apiError}>{error}</ThemedText> : null}

          <View style={styles.products}>
            {products.map((product) => {
              const quantity = items.find((item) => item.id === product.id)?.quantity ?? 0;
              return (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productImageContainer}>
                    <Image
                      source={product.imageUrl ? { uri: product.imageUrl } : product.image}
                      style={styles.productImage}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.productInfo}>
                    <ThemedText style={styles.productName}>{product.name}</ThemedText>
                    <ThemedText style={styles.productDescription}>{product.description}</ThemedText>
                    <ThemedText style={styles.productPrice}>${product.price}</ThemedText>
                    {!product.available ? (
                      <ThemedText style={styles.soldOut}>Agotado</ThemedText>
                    ) : null}
                  </View>
                  <View style={styles.addWrap}>
                    {quantity > 0 ? (
                      <View style={styles.qtyBadge}>
                        <ThemedText style={styles.qtyBadgeText}>{quantity}</ThemedText>
                      </View>
                    ) : null}
                    <Pressable
                      style={[styles.addButton, !product.available && styles.addDisabled]}
                      onPress={() => {
                        if (!product.available) {
                          Alert.alert("Agotado", `${product.name} no se puede agregar al carrito.`);
                          return;
                        }
                        if (!addProduct(product)) {
                          Alert.alert(
                            "Pedido lleno",
                            `Solo puedes agregar ${CART_LIMIT} productos por pedido.`,
                          );
                        }
                      }}
                      accessibilityLabel={`Agregar ${product.name} al carrito`}
                    >
                      <Ionicons name="add" size={28} color="#fffaf5" />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>

          <Link href={"/carrito" as never} asChild>
            <Pressable style={styles.cartButton}>
              <Ionicons name="cart-outline" size={24} color="#fffaf5" />
              <ThemedText style={styles.cartButtonText}>
                Ver carrito{totalItems > 0 ? ` (${totalItems})` : ""}
              </ThemedText>
            </Pressable>
          </Link>
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
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 130,
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
  apiError: {
    color: "#a33a2b",
    fontSize: 13,
    marginBottom: 12,
  },
  products: {
    gap: 14,
  },
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
  soldOut: {
    color: "#a33a2b",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  addDisabled: {
    backgroundColor: "#c9b8ab",
  },
  addWrap: {
    alignItems: "center",
    marginLeft: 8,
  },
  qtyBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: "#d07f30",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  qtyBadgeText: {
    color: "#fffaf5",
    fontSize: 12,
    fontWeight: "700",
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#57301c",
    alignItems: "center",
    justifyContent: "center",
  },
  cartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#d07f30",
    borderRadius: 14,
    padding: 14,
    marginTop: 22,
  },
  cartButtonText: {
    color: "#fffaf5",
    fontSize: 16,
    fontWeight: "700",
  },
});
