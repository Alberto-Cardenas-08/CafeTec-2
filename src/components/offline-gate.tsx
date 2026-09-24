import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useNetwork } from "@/context/network-context";

export function OfflineGate() {
  const { online, ready } = useNetwork();
  if (!ready || online) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.card}>
        <Ionicons name="cloud-offline-outline" size={42} color="#57301c" />
        <ThemedText style={styles.title}>Se necesita internet</ThemedText>
        <ThemedText style={styles.copy}>
          CafeTec no puede mostrar el menú ni tus pedidos sin conexión. Conéctate a WiFi o datos e inténtalo de nuevo.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(36, 21, 14, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 50,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fbf6ef",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  title: {
    color: "#24150e",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  copy: {
    color: "#795e4d",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
