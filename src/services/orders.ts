import { getApiUrl } from "@/services/api";

export const ORDER_STATUSES = ["recibido", "en_preparacion", "listo", "entregado"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItemPayload = {
  productId: string;
  quantity: number;
};

export type OrderLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  createdAt: string;
  customerName: string;
  note: string;
  status: OrderStatus;
  items: OrderLine[];
  total: number;
};

export const STATUS_STEPS: {
  id: OrderStatus;
  label: string;
  hint: string;
}[] = [
  { id: "recibido", label: "Recibido", hint: "Caja ya tiene tu pedido." },
  { id: "en_preparacion", label: "En preparación", hint: "Lo estamos armando." },
  { id: "listo", label: "Listo", hint: "Pasa a recogerlo." },
  { id: "entregado", label: "Entregado", hint: "Ya te lo dimos." },
];

export function statusIndex(status: OrderStatus) {
  const index = ORDER_STATUSES.indexOf(status);
  return index === -1 ? 0 : index;
}

export function statusLabel(status: OrderStatus) {
  return STATUS_STEPS[statusIndex(status)]?.label ?? "Recibido";
}

function readError(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return fallback;
}

export function isOrder(value: unknown): value is Order {
  if (!value || typeof value !== "object") return false;
  const order = value as Record<string, unknown>;
  return typeof order.id === "string" &&
    typeof order.createdAt === "string" &&
    typeof order.customerName === "string" &&
    typeof order.note === "string" &&
    typeof order.status === "string" &&
    ORDER_STATUSES.includes(order.status as OrderStatus) &&
    typeof order.total === "number" &&
    Array.isArray(order.items);
}

export async function createOrder(input: {
  customerName: string;
  note?: string;
  items: OrderItemPayload[];
}): Promise<Order> {
  const response = await fetch(`${getApiUrl()}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readError(data, `No se pudo crear el pedido (${response.status}).`));
  }
  if (!isOrder(data)) {
    throw new Error("La API devolvió un pedido inválido.");
  }
  return data;
}

export async function getOrder(id: string): Promise<Order> {
  const response = await fetch(`${getApiUrl()}/api/orders/${encodeURIComponent(id)}`);
  const data: unknown = await response.json().catch(() => null);
  if (response.status === 404) {
    throw new Error("Caja no encontró este pedido. Si reiniciaron la API, pide de nuevo.");
  }
  if (!response.ok) {
    throw new Error(readError(data, `No se pudo consultar el pedido (${response.status}).`));
  }
  if (!isOrder(data)) {
    throw new Error("La API devolvió un pedido inválido.");
  }
  return data;
}

export async function getOrdersByIds(ids: string[]): Promise<Order[]> {
  if (ids.length === 0) return [];
  const query = ids.map((id) => encodeURIComponent(id)).join(",");
  const response = await fetch(`${getApiUrl()}/api/orders?ids=${query}`);
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readError(data, `No se pudieron actualizar los pedidos (${response.status}).`));
  }
  if (!Array.isArray(data)) {
    throw new Error("La API devolvió un formato de pedidos inválido.");
  }
  return data.filter(isOrder);
}
