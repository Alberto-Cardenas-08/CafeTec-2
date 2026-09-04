import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCart } from "@/context/cart-context";

export default function CartScreen() {
  const { items, totalItems, removeProduct, clearCart } = useCart();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Link href="/" asChild>
              <Pressable style={styles.backButton}>
                <Ionicons name="arrow-back" size={32} color="#57301c" />
              </Pressable>
            </Link>
            <ThemedText style={styles.title}>Mi carrito</ThemedText>
            <View style={styles.headerSpace} />
          </View>

          <ThemedText style={styles.limit}>
            {totalItems} de 2 productos
          </ThemedText>

          {items.length === 0 ? (
            <ThemedText style={styles.empty}>Tu carrito está vacío.</ThemedText>
          ) : (
            <>
              {items.map((item) => (
                <View key={item.id} style={styles.item}>
                  <Image
                    source={item.imageUrl ? { uri: item.imageUrl } : item.image}
                    style={styles.image}
                    contentFit="contain"
                  />
                  <View style={styles.itemInfo}>
                    <ThemedText style={styles.name}>{item.name}</ThemedText>
                    <ThemedText style={styles.price}>
                      {typeof item.price === "number" ? `$${item.price}` : item.price} x {item.quantity}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removeProduct(item.id)} style={styles.remove}>
                    <Ionicons name="trash-outline" size={24} color="#57301c" />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={clearCart} style={styles.clearButton}>
                <ThemedText style={styles.clearText}>Vaciar carrito</ThemedText>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbf6ef" },
  safeArea: { flex: 1, maxWidth: 560, width: "100%", alignSelf: "center" },
  content: { padding: 18, paddingBottom: 40 },
  header: { height: 70, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 50, height: 50, justifyContent: "center" },
  headerSpace: { width: 50, height: 50 },
  title: { flex: 1, textAlign: "center", color: "#24150e", fontSize: 24, fontWeight: "700" },
  limit: { color: "#795e4d", fontSize: 16, marginBottom: 18 },
  empty: { color: "#795e4d", fontSize: 18, textAlign: "center", marginTop: 50 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 12 },
  image: { width: 70, height: 70 },
  itemInfo: { flex: 1, marginLeft: 10 },
  name: { color: "#24150e", fontSize: 17, fontWeight: "700" },
  price: { color: "#57301c", fontSize: 16, marginTop: 6 },
  remove: { padding: 10 },
  clearButton: { backgroundColor: "#57301c", borderRadius: 12, padding: 15, alignItems: "center", marginTop: 8 },
  clearText: { color: "#fffaf5", fontWeight: "700", fontSize: 16 },
});
