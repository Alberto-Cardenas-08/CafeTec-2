import { getApiUrl } from "@/services/api";
import { getSupabase, isSupabaseConfigured } from "@/services/supabase";

export const ORDER_STATUSES = ["recibido", "en_preparacion", "listo", "entregado", "cancelado"] as const;

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
  imageUrl?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  customerName: string;
  note: string;
  status: OrderStatus;
  items: OrderLine[];
  total: number;
  deviceId?: string;
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
  if (status === "cancelado") return "Cancelado";
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

type OrderRow = {
  id: string;
  created_at: string;
  customer_name: string;
  note: string;
  status: string;
  total: number | string;
  device_id?: string;
  order_items?: {
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number | string;
    line_total: number | string;
    image_url?: string | null;
  }[];
};

function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    customerName: row.customer_name ?? "",
    note: row.note ?? "",
    status: row.status as Order["status"],
    total: Number(row.total),
    deviceId: row.device_id,
    items: (row.order_items ?? []).map((item) => ({
      productId: item.product_id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total),
      imageUrl: item.image_url || undefined,
    })),
  };
}

export async function createOrder(input: {
  customerName: string;
  note?: string;
  items: OrderItemPayload[];
  deviceId?: string;
}): Promise<Order> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabase().rpc("create_cafetec_order", {
      p_customer_name: input.customerName,
      p_note: input.note ?? "",
      p_items: input.items,
      p_device_id: input.deviceId ?? "",
    });
    if (error) throw new Error(error.message);
    if (!isOrder(data)) throw new Error("Supabase devolvió un pedido inválido.");
    return {
      ...data,
      createdAt: String(data.createdAt),
      total: Number(data.total),
    };
  }

  const response = await fetch(`${getApiUrl()}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readError(payload, `No se pudo crear el pedido (${response.status}).`));
  }
  if (!isOrder(payload)) {
    throw new Error("La API devolvió un pedido inválido.");
  }
  return payload;
}

export async function getOrder(id: string): Promise<Order> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabase()
      .from("orders")
      .select("id, created_at, customer_name, note, status, total, device_id, order_items(product_id, name, quantity, unit_price, line_total, image_url)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Caja no encontró este pedido.");
    return mapOrderRow(data as OrderRow);
  }

  const response = await fetch(`${getApiUrl()}/api/orders/${encodeURIComponent(id)}`);
  const payload: unknown = await response.json().catch(() => null);
  if (response.status === 404) {
    throw new Error("Caja no encontró este pedido. Si reiniciaron la API, pide de nuevo.");
  }
  if (!response.ok) {
    throw new Error(readError(payload, `No se pudo consultar el pedido (${response.status}).`));
  }
  if (!isOrder(payload)) {
    throw new Error("La API devolvió un pedido inválido.");
  }
  return payload;
}

export async function getOrdersByIds(ids: string[]): Promise<Order[]> {
  if (ids.length === 0) return [];
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabase()
      .from("orders")
      .select("id, created_at, customer_name, note, status, total, device_id, order_items(product_id, name, quantity, unit_price, line_total, image_url)")
      .in("id", ids);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: OrderRow) => mapOrderRow(row));
  }

  const query = ids.map((id) => encodeURIComponent(id)).join(",");
  const response = await fetch(`${getApiUrl()}/api/orders?ids=${query}`);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readError(payload, `No se pudieron actualizar los pedidos (${response.status}).`));
  }
  if (!Array.isArray(payload)) {
    throw new Error("La API devolvió un formato de pedidos inválido.");
  }
  return payload.filter(isOrder);
}

export async function getOrdersByDeviceId(deviceId: string): Promise<Order[]> {
  if (!deviceId || !isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from("orders")
    .select("id, created_at, customer_name, note, status, total, device_id, order_items(product_id, name, quantity, unit_price, line_total, image_url)")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: OrderRow) => mapOrderRow(row));
}
