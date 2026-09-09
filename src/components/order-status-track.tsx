import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { STATUS_STEPS, statusIndex, type OrderStatus } from "@/services/orders";

export function OrderStatusTrack({ status }: { status: OrderStatus }) {
  const current = statusIndex(status);

  return (
    <View style={styles.track}>
      {STATUS_STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={step.id} style={styles.stepRow}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#fffaf5" />
                ) : (
                  <ThemedText style={styles.dotNumber}>{index + 1}</ThemedText>
                )}
              </View>
              {index < STATUS_STEPS.length - 1 ? (
                <View style={[styles.line, index < current && styles.lineDone]} />
              ) : null}
            </View>
            <View style={styles.copy}>
              <ThemedText style={[styles.label, active && styles.labelActive]}>
                {step.label}
              </ThemedText>
              {active ? <ThemedText style={styles.hint}>{step.hint}</ThemedText> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 58,
  },
  rail: {
    width: 28,
    alignItems: "center",
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#d7c4b6",
    backgroundColor: "#fffaf5",
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: {
    borderColor: "#d07f30",
    backgroundColor: "#d07f30",
  },
  dotDone: {
    borderColor: "#57301c",
    backgroundColor: "#57301c",
  },
  dotNumber: {
    color: "#795e4d",
    fontSize: 12,
    fontWeight: "700",
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: "#eaded5",
    marginVertical: 4,
  },
  lineDone: {
    backgroundColor: "#57301c",
  },
  copy: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 12,
  },
  label: {
    color: "#795e4d",
    fontSize: 16,
    fontWeight: "600",
  },
  labelActive: {
    color: "#24150e",
    fontWeight: "700",
  },
  hint: {
    color: "#795e4d",
    fontSize: 13,
    marginTop: 4,
  },
});
