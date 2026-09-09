import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useOrders } from "@/context/orders-context";
import { getOrder, statusLabel, type Order, type OrderStatus } from "@/services/orders";

const STATUS_COLOR: Record<OrderStatus, string> = {
  recibido: "#d07f30",
  en_preparacion: "#57301c",
  listo: "#2f7d4a",
  entregado: "#795e4d",
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, rememberOrder, refreshOrders } = useOrders();
  const [lookupId, setLookupId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setRefreshing(true);
      refreshOrders()
        .catch((error: unknown) => {
          if (active) {
            console.warn("No se pudieron actualizar los pedidos.", error);
          }
        })
        .finally(() => {
          if (active) setRefreshing(false);
        });
      return () => {
        active = false;
      };
    }, [refreshOrders]),
  );

  const lookup = async () => {
    const id = lookupId.trim();
    if (!id) {
      Alert.alert("Falta el número", "Escribe el número de pedido, por ejemplo ord-0001.");
      return;
    }
    setLookingUp(true);
    try {
      const order = await getOrder(id);
      rememberOrder(order);
      setLookupId("");
      router.push({ pathname: "/pedido", params: { id: order.id } } as never);
    } catch (error: unknown) {
      Alert.alert(
        "No se encontró",
        error instanceof Error ? error.message : "Revisa el número e inténtalo de nuevo.",
      );
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText style={styles.title}>Mis pedidos</ThemedText>
          <ThemedText style={styles.intro}>
            Consulta si tu pedido ya lo recibieron, lo están preparando o está listo para recoger.
          </ThemedText>

          <View style={styles.lookup}>
            <TextInput
              value={lookupId}
              onChangeText={setLookupId}
              placeholder="Número de pedido, ej. ord-0001"
              placeholderTextColor="#a08a7a"
              autoCapitalize="none"
              style={styles.input}
            />
            <Pressable onPress={lookup} disabled={lookingUp} style={styles.lookupButton}>
              {lookingUp ? (
                <ActivityIndicator color="#fffaf5" />
              ) : (
                <ThemedText style={styles.lookupText}>Buscar</ThemedText>
              )}
            </Pressable>
          </View>

          {refreshing ? <ThemedText style={styles.refresh}>Actualizando estados…</ThemedText> : null}

          {orders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={36} color="#d07f30" />
              <ThemedText style={styles.empty}>
                Aún no tienes pedidos en este teléfono. Haz uno desde el carrito o búscalo por número.
              </ThemedText>
            </View>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => router.push({ pathname: "/pedido", params: { id: order.id } } as never)}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const count = order.items.reduce((total, item) => total + item.quantity, 0);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardTop}>
        <ThemedText style={styles.orderId}>{order.id}</ThemedText>
        <View style={[styles.pill, { backgroundColor: STATUS_COLOR[order.status] }]}>
          <ThemedText style={styles.pillText}>{statusLabel(order.status)}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.meta}>
        {formatWhen(order.createdAt)} · {count} {count === 1 ? "producto" : "productos"} · ${order.total}
      </ThemedText>
      <ThemedText style={styles.preview} numberOfLines={1}>
        {order.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}
      </ThemedText>
      <View style={styles.cardFooter}>
        <ThemedText style={styles.link}>Ver estado</ThemedText>
        <Ionicons name="chevron-forward" size={18} color="#57301c" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbf6ef" },
  safeArea: { flex: 1, maxWidth: 560, width: "100%", alignSelf: "center" },
  content: { padding: 18, paddingBottom: 40 },
  title: { color: "#24150e", fontSize: 28, fontWeight: "700", marginBottom: 8 },
  intro: { color: "#795e4d", fontSize: 15, lineHeight: 22, marginBottom: 18 },
  lookup: { flexDirection: "row", gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#24150e",
    fontSize: 15,
  },
  lookupButton: {
    backgroundColor: "#57301c",
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    minWidth: 88,
    alignItems: "center",
  },
  lookupText: { color: "#fffaf5", fontWeight: "700" },
  refresh: { color: "#795e4d", fontSize: 13, marginBottom: 12 },
  emptyBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    gap: 12,
    marginTop: 8,
  },
  empty: { color: "#795e4d", fontSize: 15, textAlign: "center", lineHeight: 22 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  pressed: { opacity: 0.8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { color: "#24150e", fontSize: 18, fontWeight: "700" },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: "#fffaf5", fontSize: 12, fontWeight: "700" },
  meta: { color: "#795e4d", fontSize: 13, marginTop: 8 },
  preview: { color: "#57301c", fontSize: 14, marginTop: 6 },
  cardFooter: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 4 },
  link: { color: "#57301c", fontWeight: "700", fontSize: 14 },
});
