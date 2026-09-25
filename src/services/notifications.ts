import Constants from "expo-constants";
import { Platform } from "react-native";

import { statusLabel, type OrderStatus } from "@/services/orders";

function isExpoGo() {
  return Constants.appOwnership === "expo";
}

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
  // Expo Go (SDK 53+) no permite el módulo de push; el aviso va en Alert.
  if (Platform.OS === "web" || isExpoGo()) {
    return { title, body, usedNotification: false };
  }
  return { title, body, usedNotification: false };
}
