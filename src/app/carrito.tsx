import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CafeStatusBanner } from "@/components/cafe-status-banner";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCafe } from "@/context/cafe-context";
import { CART_LIMIT, parsePrice, useCart } from "@/context/cart-context";
import { useOrders } from "@/context/orders-context";
import { createOrder, formatCooldown, getCancelPenalty, getOrderCooldown } from "@/services/orders";
import { getProducts } from "@/services/products";

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    totalItems,
    totalPrice,
    incrementProduct,
    decrementProduct,
    removeProduct,
    clearCart,
  } = useCart();
  const { lastCustomerName, rememberOrder, deviceId, orders } = useOrders();
  const { isOpen } = useCafe();
  const cooldown = getOrderCooldown(orders, deviceId);
  const cancelPenalty = getCancelPenalty(orders, deviceId);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const customerName = nameDraft ?? lastCustomerName;
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const placeOrder = async () => {
    const name = customerName.trim();
    if (!name) {
      Alert.alert("Falta tu nombre", "Escríbelo para identificar el pedido en caja.");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Carrito vacío", "Agrega productos antes de pedir.");
      return;
    }
    if (!isOpen) {
      Alert.alert("Cafetería cerrada", "Puedes armar el carrito, pero ahora no se reciben pedidos.");
      return;
    }
    if (cooldown.blocked) {
      Alert.alert(
        "Espera un poco",
        `Este dispositivo ya hizo un pedido. Podrás pedir de nuevo en ${formatCooldown(cooldown.remainingMs)}.`,
      );
      return;
    }
    if (cancelPenalty.blocked) {
      Alert.alert(
        "Penalización por cancelar",
        `Cancelaste un pedido. Podrás volver a pedir en ${formatCooldown(cancelPenalty.remainingMs)}.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const catalog = await getProducts().catch(() => []);
      const missing = items.filter((item) => {
        const product = catalog.find((entry) => entry.id === item.id);
        return !product || product.available === false;
      });
      if (missing.length > 0) {
        Alert.alert(
          "No se puede pedir",
          "Uno de los productos de tu carrito ya no está disponible.",
        );
        setSubmitting(false);
        return;
      }

      const order = await createOrder({
        customerName: name,
        note: note.trim(),
        deviceId,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });
      rememberOrder(order);
      clearCart();
      setNote("");
      Alert.alert(
        "Pedido enviado",
        `Gracias, ${name}. Tu pedido ${order.id} es de $${order.total}.`,
        [
          { text: "Seguir en el menú" },
          {
            text: "Ver estado",
            onPress: () => router.push({ pathname: "/pedido", params: { id: order.id } } as never),
          },
        ],
      );
    } catch (error: unknown) {
      Alert.alert(
        "No se pudo enviar",
        error instanceof Error
          ? error.message
          : "Revisa la conexión con la API e inténtalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Link href="/" asChild>
                <Pressable style={styles.backButton} accessibilityLabel="Volver al menú">
                  <Ionicons name="arrow-back" size={32} color="#57301c" />
                </Pressable>
              </Link>
              <ThemedText style={styles.title}>Mi carrito</ThemedText>
              <View style={styles.headerSpace} />
            </View>

            <CafeStatusBanner />
            {cooldown.blocked ? (
              <ThemedText style={styles.cooldown}>
                Este dispositivo ya pidió. Podrás hacer otro pedido en {formatCooldown(cooldown.remainingMs)}.
              </ThemedText>
            ) : null}
            {cancelPenalty.blocked && !cooldown.blocked ? (
              <ThemedText style={styles.cooldown}>
                Cancelaste un pedido. Podrás volver a pedir en {formatCooldown(cancelPenalty.remainingMs)}.
              </ThemedText>
            ) : null}
            <ThemedText style={styles.limit}>
              {totalItems} {totalItems === 1 ? "producto" : "productos"}
              {totalItems > 0 ? ` · máximo ${CART_LIMIT}` : ""}
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
                        ${parsePrice(item.price)} c/u · ${parsePrice(item.price) * item.quantity}
                      </ThemedText>
                      <View style={styles.qtyRow}>
                        <Pressable
                          onPress={() => decrementProduct(item.id)}
                          style={styles.qtyButton}
                          accessibilityLabel={`Quitar uno de ${item.name}`}
                        >
                          <Ionicons name="remove" size={18} color="#57301c" />
                        </Pressable>
                        <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
                        <Pressable
                          onPress={() => {
                            if (!incrementProduct(item.id)) {
                              Alert.alert(
                                "Máximo 3 productos",
                                "Solo puedes agregar 3 productos por pedido.",
                              );
                            }
                          }}
                          style={styles.qtyButton}
                          accessibilityLabel={`Agregar uno de ${item.name}`}
                        >
                          <Ionicons name="add" size={18} color="#57301c" />
                        </Pressable>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => removeProduct(item.id)}
                      style={styles.remove}
                      accessibilityLabel={`Quitar ${item.name} del carrito`}
                    >
                      <Ionicons name="trash-outline" size={24} color="#57301c" />
                    </Pressable>
                  </View>
                ))}

                <View style={styles.totalBox}>
                  <ThemedText style={styles.totalLabel}>Total</ThemedText>
                  <ThemedText style={styles.totalValue}>${totalPrice}</ThemedText>
                </View>

                <ThemedText style={styles.fieldLabel}>Tu nombre</ThemedText>
                <TextInput
                  value={customerName}
                  onChangeText={setNameDraft}
                  placeholder="Ej. Alberto"
                  placeholderTextColor="#a08a7a"
                  style={styles.input}
                  maxLength={80}
                />

                <ThemedText style={styles.fieldLabel}>Nota para caja (opcional)</ThemedText>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ej. Mesa 4, sin azúcar, para recoger"
                  placeholderTextColor="#a08a7a"
                  style={[styles.input, styles.noteInput]}
                  maxLength={300}
                  multiline
                />

                <Pressable
                  onPress={placeOrder}
                  disabled={submitting || !isOpen || cooldown.blocked || cancelPenalty.blocked}
                  style={[styles.orderButton, (submitting || !isOpen || cooldown.blocked || cancelPenalty.blocked) && styles.disabled]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fffaf5" />
                  ) : (
                    <ThemedText style={styles.orderText}>Hacer pedido</ThemedText>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => {
                    Alert.alert("Vaciar carrito", "¿Seguro? Se quitarán todos los productos.", [
                      { text: "No" },
                      { text: "Sí, vaciar", style: "destructive", onPress: clearCart },
                    ]);
                  }}
                  style={styles.clearButton}
                >
                  <ThemedText style={styles.clearText}>Vaciar carrito</ThemedText>
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbf6ef" },
  safeArea: { flex: 1, maxWidth: 560, width: "100%", alignSelf: "center" },
  flex: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  header: { height: 70, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 50, height: 50, justifyContent: "center" },
  headerSpace: { width: 50, height: 50 },
  title: { flex: 1, textAlign: "center", color: "#24150e", fontSize: 24, fontWeight: "700" },
  limit: { color: "#795e4d", fontSize: 16, marginBottom: 18 },
  empty: { color: "#795e4d", fontSize: 18, textAlign: "center", marginTop: 50 },
  closed: { color: "#a33a2b", fontSize: 14, lineHeight: 20, marginBottom: 16 },
  cooldown: {
    color: "#8a2b22",
    backgroundColor: "#f8e8e4",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    fontWeight: "700",
  },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 12 },
  image: { width: 70, height: 70 },
  itemInfo: { flex: 1, marginLeft: 10 },
  name: { color: "#24150e", fontSize: 17, fontWeight: "700" },
  price: { color: "#57301c", fontSize: 15, marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#57301c",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { color: "#24150e", fontSize: 16, fontWeight: "700", minWidth: 18, textAlign: "center" },
  remove: { padding: 10 },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    marginBottom: 18,
  },
  totalLabel: { color: "#24150e", fontSize: 18, fontWeight: "700" },
  totalValue: { color: "#57301c", fontSize: 22, fontWeight: "700" },
  fieldLabel: { color: "#24150e", fontSize: 14, fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#24150e",
    fontSize: 16,
    marginBottom: 14,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  orderButton: {
    backgroundColor: "#d07f30",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 4,
  },
  orderText: { color: "#fffaf5", fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.7 },
  clearButton: { backgroundColor: "#57301c", borderRadius: 12, padding: 15, alignItems: "center", marginTop: 10 },
  clearText: { color: "#fffaf5", fontWeight: "700", fontSize: 16 },
});
