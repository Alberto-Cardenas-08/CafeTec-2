import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const drinks = [
  { name: "Limonada natural", description: "Limones frescos con hielo", price: "$28", icon: "🍋" },
  { name: "Te helado", description: "Te negro, limon y mucho hielo", price: "$30", icon: "🧋" },
  { name: "Cold brew", description: "Cafe de extraccion lenta y frio", price: "$42", icon: "🧊" },
  { name: "Smoothie de frutos rojos", description: "Frutos rojos, yogurt y miel", price: "$45", icon: "🍓" },
];

export default function ColdDrinksScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Link href="/" asChild>
              <Pressable><ThemedText style={styles.back}>‹</ThemedText></Pressable>
            </Link>
            <ThemedText style={styles.cart}>🛒</ThemedText>
          </View>
          <View style={styles.heading}>
            <ThemedText style={styles.headingIcon}>🥤</ThemedText>
            <View>
              <ThemedText style={styles.title}>Bebidas Frias</ThemedText>
              <ThemedText style={styles.subtitle}>Refrescantes y preparadas al momento</ThemedText>
            </View>
          </View>
          <View style={styles.list}>
            {drinks.map((drink) => (
              <View key={drink.name} style={styles.product}>
                <View style={styles.productIcon}><ThemedText style={styles.emoji}>{drink.icon}</ThemedText></View>
                <View style={styles.productInfo}>
                  <ThemedText style={styles.name}>{drink.name}</ThemedText>
                  <ThemedText style={styles.description}>{drink.description}</ThemedText>
                  <ThemedText style={styles.price}>{drink.price}</ThemedText>
                </View>
                <Pressable style={styles.addButton}><ThemedText style={styles.plus}>+</ThemedText></Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbf6ef" },
  safeArea: { flex: 1, maxWidth: 560, width: "100%", alignSelf: "center" },
  content: { padding: 20, paddingBottom: 100 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  back: { fontSize: 42, lineHeight: 36, color: "#4e2918" },
  cart: { fontSize: 24 },
  heading: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
  headingIcon: { backgroundColor: "#5b2d16", borderRadius: 40, padding: 14, fontSize: 30 },
  title: { color: "#29170e", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#795e4d", fontSize: 13, marginTop: 4 },
  list: { gap: 10 },
  product: { backgroundColor: "#fffdf9", borderRadius: 16, padding: 12, minHeight: 104, flexDirection: "row", alignItems: "center", shadowColor: "#5b2d16", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  productIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#f2e5d5", alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 38 },
  productInfo: { flex: 1, paddingHorizontal: 12 },
  name: { color: "#27160d", fontWeight: "800", fontSize: 16 },
  description: { color: "#795e4d", fontSize: 12, marginTop: 3 },
  price: { color: "#5b2d16", fontSize: 16, fontWeight: "800", marginTop: 5 },
  addButton: { backgroundColor: "#5b2d16", borderRadius: 10, width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  plus: { color: "#fffaf5", fontSize: 27, lineHeight: 30 },
});