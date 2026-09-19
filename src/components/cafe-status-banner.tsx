import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useCafe } from "@/context/cafe-context";

export function CafeStatusBanner() {
  const { isOpen } = useCafe();

  return (
    <View style={[styles.banner, isOpen ? styles.open : styles.closed]}>
      <View style={[styles.dot, isOpen ? styles.dotOpen : styles.dotClosed]} />
      <Ionicons
        name={isOpen ? "storefront" : "moon"}
        size={18}
        color={isOpen ? "#1f6b3a" : "#8a2b22"}
      />
      <ThemedText style={[styles.text, isOpen ? styles.textOpen : styles.textClosed]}>
        {isOpen
          ? "Cafetería abierta · ya puedes hacer tu pedido"
          : "Cafetería cerrada · puedes ver el menú, pero no pedir"}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  open: {
    backgroundColor: "#e7f6ec",
  },
  closed: {
    backgroundColor: "#f8e8e4",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOpen: {
    backgroundColor: "#2f7d4a",
  },
  dotClosed: {
    backgroundColor: "#a33a2b",
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  textOpen: {
    color: "#1f6b3a",
  },
  textClosed: {
    color: "#8a2b22",
  },
});
