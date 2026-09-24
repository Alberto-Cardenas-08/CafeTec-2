import { Ionicons } from "@expo/vector-icons";
import {
  TabList,
  TabListProps,
  TabSlot,
  Tabs,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View, useColorScheme } from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import { Colors, MaxContentWidth, Spacing } from "@/constants/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

const hidden = { width: 0, height: 0, overflow: "hidden" as const, position: "absolute" as const };

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton iconName="home">Home</TabButton>
          </TabTrigger>
          <TabTrigger name="carrito" href="/carrito" asChild>
            <TabButton iconName="cart">Carrito</TabButton>
          </TabTrigger>
          <TabTrigger name="pedidos" href="/pedidos" asChild>
            <TabButton iconName="receipt">Pedidos</TabButton>
          </TabTrigger>
          <TabTrigger name="bebidas-calientes" href="/bebidas-calientes" asChild>
            <View style={hidden} />
          </TabTrigger>
          <TabTrigger name="bebidas-frias" href="/bebidas-frias" asChild>
            <View style={hidden} />
          </TabTrigger>
          <TabTrigger name="frappes" href="/frappes" asChild>
            <View style={hidden} />
          </TabTrigger>
          <TabTrigger name="lunch" href="/lunch" asChild>
            <View style={hidden} />
          </TabTrigger>
          <TabTrigger name="categoria" href="/categoria/[id]" asChild>
            <View style={hidden} />
          </TabTrigger>
          <TabTrigger name="pedido" href="/pedido" asChild>
            <View style={hidden} />
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  iconName,
  isFocused,
  ...props
}: TabTriggerSlotProps & { iconName: IconName }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? "backgroundSelected" : "backgroundElement"}
        style={styles.tabButtonView}
      >
        <Ionicons
          name={iconName}
          size={18}
          color={isFocused ? colors.text : colors.textSecondary}
        />
        <ThemedText type="small" themeColor={isFocused ? "text" : "textSecondary"}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          CafeTec
        </ThemedText>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: "absolute",
    width: "100%",
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    overflow: "hidden",
  },
  brandText: {
    marginRight: "auto",
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
});
