import { Platform } from "react-native";

import { statusLabel, type OrderStatus } from "@/services/orders";

let permissionAsked = false;

export function statusMessage(status: OrderStatus, orderId: string) {
  switch (status) {
    case "en_preparacion":
      return {
        title: "Pedido en preparación",
        body: `Tu pedido ${orderId} ya se está armando.`,
      };
    case "listo":
      return {
        title: "Pedido listo",
        body: `Tu pedido ${orderId} ya está listo. Pasa a recogerlo a caja.`,
      };
    case "entregado":
      return {
        title: "Pedido entregado",
        body: `Tu pedido ${orderId} ya te lo entregamos. ¡Gracias!`,
      };
    case "cancelado":
      return {
        title: "Pedido cancelado",
        body: `Tu pedido ${orderId} fue cancelado.`,
      };
    default:
      return {
        title: "Actualización de pedido",
        body: `Tu pedido ${orderId} está ${statusLabel(status).toLowerCase()}.`,
      };
  }
}

export async function notifyOrderStatus(status: OrderStatus, orderId: string) {
  const { title, body } = statusMessage(status, orderId);
  if (Platform.OS === "web") return { title, body, usedNotification: false };

  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    if (!permissionAsked) {
      permissionAsked = true;
      const current = await Notifications.getPermissionsAsync();
      if (current.status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    }
    const granted = (await Notifications.getPermissionsAsync()).status === "granted";
    if (!granted) return { title, body, usedNotification: false };
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
    return { title, body, usedNotification: true };
  } catch {
    return { title, body, usedNotification: false };
  }
}
