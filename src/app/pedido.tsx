import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OrderStatusTrack } from "@/components/order-status-track";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useOrders } from "@/context/orders-context";
import { getOrder, statusLabel } from "@/services/orders";
import { getProductImage } from "@/services/products";

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { orders, rememberOrder } = useOrders();
  const cached = orders.find((order) => order.id === id);
  const [order, setOrder] = useState(cached);
  const live = orders.find((item) => item.id === id) ?? order;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setError("Falta el número de pedido.");
        setLoading(false);
        return;
      }

      let active = true;
      getOrder(id)
        .then((latest) => {
          if (!active) return;
          setOrder(latest);
          rememberOrder(latest);
          setError(null);
        })
        .catch((reason: unknown) => {
          if (!active) return;
          setError(reason instanceof Error ? reason.message : "No se pudo cargar el pedido.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [id, rememberOrder]),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Link href="/pedidos" asChild>
              <Pressable style={styles.backButton} accessibilityLabel="Volver a mis pedidos">
                <Ionicons name="arrow-back" size={32} color="#57301c" />
              </Pressable>
            </Link>
            <ThemedText style={styles.title}>Estado del pedido</ThemedText>
            <View style={styles.headerSpace} />
          </View>

          {loading && !live ? (
            <ActivityIndicator color="#57301c" style={styles.loader} />
          ) : null}

          {error && !live ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

          {live ? (
            <>
              <ThemedText style={styles.orderId}>{live.id}</ThemedText>
              <ThemedText style={styles.meta}>
                {live.customerName} · {formatWhen(live.createdAt)}
              </ThemedText>
              <ThemedText style={styles.statusNow}>
                Ahora: {statusLabel(live.status)}
              </ThemedText>

              <OrderStatusTrack status={live.status} />

              <ThemedText style={styles.section}>Tu pedido</ThemedText>
              {live.items.map((item) => (
                <View key={`${item.productId}-${item.name}`} style={styles.item}>
                  <Image source={getProductImage(item.productId)} style={styles.image} contentFit="contain" />
                  <View style={styles.itemInfo}>
                    <ThemedText style={styles.name}>{item.name}</ThemedText>
                    <ThemedText style={styles.line}>
                      {item.quantity} × ${item.unitPrice}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.lineTotal}>${item.lineTotal}</ThemedText>
                </View>
              ))}

              {live.note ? (
                <ThemedText style={styles.note}>Nota: {live.note}</ThemedText>
              ) : null}

              <View style={styles.totalBox}>
                <ThemedText style={styles.totalLabel}>Total</ThemedText>
                <ThemedText style={styles.totalValue}>${live.total}</ThemedText>
              </View>

              <ThemedText style={styles.footnote}>
                El personal de CafeTec irá moviendo el estado. Aquí solo lo consultas.
              </ThemedText>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbf6ef" },
  safeArea: { flex: 1, maxWidth: 560, width: "100%", alignSelf: "center" },
  content: { padding: 18, paddingBottom: 40 },
  header: { height: 70, flexDirection: "row", alignItems: "center" },
  backButton: { width: 50, height: 50, justifyContent: "center" },
  headerSpace: { width: 50, height: 50 },
  title: { flex: 1, textAlign: "center", color: "#24150e", fontSize: 22, fontWeight: "700" },
  loader: { marginTop: 40 },
  error: { color: "#a33a2b", fontSize: 15, textAlign: "center", marginTop: 24 },
  orderId: { color: "#24150e", fontSize: 26, fontWeight: "700" },
  meta: { color: "#795e4d", fontSize: 14, marginTop: 6, marginBottom: 4 },
  statusNow: { color: "#57301c", fontSize: 16, fontWeight: "700", marginBottom: 16 },
  section: { color: "#24150e", fontSize: 18, fontWeight: "700", marginTop: 22, marginBottom: 10 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  image: { width: 54, height: 54 },
  itemInfo: { flex: 1, marginLeft: 8 },
  name: { color: "#24150e", fontSize: 16, fontWeight: "700" },
  line: { color: "#795e4d", marginTop: 4 },
  lineTotal: { color: "#57301c", fontWeight: "700", fontSize: 16 },
  note: { color: "#795e4d", fontSize: 14, marginTop: 8 },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  totalLabel: { color: "#24150e", fontSize: 18, fontWeight: "700" },
  totalValue: { color: "#57301c", fontSize: 22, fontWeight: "700" },
  footnote: { color: "#795e4d", fontSize: 13, lineHeight: 19, marginTop: 16, textAlign: "center" },
});
