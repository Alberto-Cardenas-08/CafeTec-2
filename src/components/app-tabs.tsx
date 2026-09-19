import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useCart } from "@/context/cart-context";
import { useOrders } from "@/context/orders-context";

export default function AppTabs() {
  const { totalItems } = useCart();
  const activeOrders = useOrders().orders.filter((order) => order.status !== "entregado").length;

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
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: { backgroundColor: "#d07f30", color: "#fffaf5" },
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Pedidos",
          tabBarBadge: activeOrders > 0 ? activeOrders : undefined,
          tabBarBadgeStyle: { backgroundColor: "#d07f30", color: "#fffaf5" },
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="pedido" options={{ href: null }} />
      <Tabs.Screen name="categoria/[id]" options={{ href: null }} />
      <Tabs.Screen name="bebidas-calientes" options={{ href: null }} />
      <Tabs.Screen name="bebidas-frias" options={{ href: null }} />
      <Tabs.Screen name="frappes" options={{ href: null }} />
      <Tabs.Screen name="lunch" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
