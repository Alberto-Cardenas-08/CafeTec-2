import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#57301c",
        tabBarInactiveTintColor: "#795e4d",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="carrito"
        options={{
          title: "Carrito",
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="bebidas-calientes" options={{ href: null }} />
      <Tabs.Screen name="bebidas-frias" options={{ href: null }} />
      <Tabs.Screen name="frappes" options={{ href: null }} />
      <Tabs.Screen name="lunch" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
