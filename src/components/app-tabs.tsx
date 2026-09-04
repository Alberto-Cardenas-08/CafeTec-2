import { Tabs } from "expo-router";

export default function AppTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="bebidas-calientes" options={{ href: null }} />
      <Tabs.Screen name="bebidas-frias" options={{ href: null }} />
      <Tabs.Screen name="frappes" options={{ href: null }} />
      <Tabs.Screen name="lunch" options={{ href: null }} />
      <Tabs.Screen name="carrito" options={{ href: null }} />
    </Tabs>
  );
}
