const DEFAULT_URL = "https://afqycxwuvzmksompycco.supabase.co";
const state = {
  products: [],
  orders: [],
  editingId: null,
  api: localStorage.getItem("cafetecApi") || DEFAULT_URL,
  anonKey: localStorage.getItem("cafetecAnonKey") || "",
};
const $ = (id) => document.getElementById(id);
$("apiUrl").value = state.api;
if ($("anonKey")) $("anonKey").value = state.anonKey;
const categoryNames = {
  "hot-drinks": "Bebidas calientes",
  "cold-drinks": "Bebidas frías",
  frappes: "Frappes",
  lunch: "Lunch",
};

function api(path = "") {
  return state.api.replace(/\/$/, "") + path;
}
function isSupabase() {
  return /supabase\.co/i.test(state.api) && Boolean(state.anonKey);
}
function money(n) {
  return Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
function supabaseHeaders(extra = {}) {
  return {
    apikey: state.anonKey,
    Authorization: "Bearer " + state.anonKey,
    "Content-Type": "application/json",
    ...extra,
  };
}
function mapProduct(p) {
  return {
    id: p.id,
    category: p.category,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    imageUrl: p.image_url || p.imageUrl,
  };
}
function mapOrder(o) {
  const items = (o.order_items || o.items || []).map((i) => ({
    productId: i.product_id || i.productId,
    name: i.name,
    quantity: i.quantity,
    unitPrice: Number(i.unit_price ?? i.unitPrice),
    lineTotal: Number(i.line_total ?? i.lineTotal),
  }));
  return {
    id: o.id,
    createdAt: o.created_at || o.createdAt,
    customerName: o.customer_name || o.customerName || "",
    note: o.note || "",
    status: o.status || "recibido",
    total: Number(o.total || 0),
    items,
  };
}

async function request(path, options = {}) {
  const r = await fetch(api(path), {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!r.ok) {
    let e = "Error " + r.status;
    try {
      const j = await r.json();
      e = j.error || e;
    } catch {}
    throw new Error(e);
  }
  return r.status === 204 ? null : r.json();
}

async function supabaseFetch(path, options = {}) {
  const r = await fetch(api(path), { ...options, headers: supabaseHeaders(options.headers || {}) });
  if (!r.ok) {
    let e = "Error " + r.status;
    try {
      const j = await r.json();
      e = j.message || j.error || e;
    } catch {}
    throw new Error(e);
  }
  if (r.status === 204) return null;
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

async function load() {
  setConnection(false, "Conectando…");
  try {
    if (isSupabase()) {
      const [p, o] = await Promise.all([
        supabaseFetch("/rest/v1/products?select=*&order=name.asc"),
        supabaseFetch("/rest/v1/orders?select=*,order_items(*)&order=created_at.desc"),
      ]);
      state.products = (p || []).map(mapProduct);
      state.orders = (o || []).map(mapOrder);
    } else {
      const [p, o] = await Promise.all([request("/api/products"), request("/api/orders")]);
      state.products = p;
      state.orders = o;
    }
    setConnection(true, "Conectado");
    renderProducts();
    renderOrders();
    renderStats();
  } catch (e) {
    setConnection(false, "Sin conexión");
    $("productsGrid").innerHTML =
      '<div class="empty">No se pudo conectar a Supabase.<br><small>Pega la <b>anon key</b> (Project Settings → API) y corre <b>supabase/schema.sql</b> en el SQL Editor.</small></div>';
    $("ordersList").innerHTML = '<div class="empty">No se pudieron cargar los pedidos.</div>';
    renderStats();
  }
}

function setConnection(ok, text) {
  $("connection").textContent = text;
  $("connection").className = "status " + (ok ? "online" : "offline");
  $("statApi").textContent = ok ? "Online" : "Offline";
}
function renderStats() {
  $("statProducts").textContent = state.products.length || "0";
  $("statOrders").textContent = state.orders.length || "0";
  $("statSales").textContent = money(state.orders.reduce((s, o) => s + Number(o.total || 0), 0));
}
function renderProducts() {
  const q = $("search").value.toLowerCase();
  const c = $("categoryFilter").value;
  const list = state.products.filter(
    (p) =>
      (!q || `${p.name} ${p.id} ${p.description}`.toLowerCase().includes(q)) && (!c || p.category === c),
  );
  $("productsGrid").innerHTML = list.length
    ? list
        .map(
          (p) =>
            `<article class="product-card"><div class="product-image">${p.imageUrl ? `<img src="${escapeAttr(p.imageUrl)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">` : ""}<span class="product-placeholder" ${p.imageUrl ? 'style="display:none"' : ""}>☕</span></div><div class="product-body"><h4>${esc(p.name)}</h4><p>${esc(p.description)}</p><div class="product-meta"><span class="price">${money(p.price)}</span><span class="badge">${esc(categoryNames[p.category] || p.category)}</span></div><div class="product-actions"><button onclick="editProduct('${escAttr(p.id)}')">✏️ Editar</button><button class="danger" onclick="removeProduct('${escAttr(p.id)}')">🗑️ Eliminar</button></div></div></article>`,
        )
        .join("")
    : '<div class="empty">No hay productos con esos filtros.</div>';
}
function renderOrders() {
  $("ordersCount").textContent = state.orders.length;
  $("ordersList").innerHTML = state.orders.length
    ? state.orders
        .map(
          (o) =>
            `<article class="order"><div class="order-top"><strong>${esc(o.id)}${o.customerName ? " · " + esc(o.customerName) : ""}</strong><span>${new Date(o.createdAt).toLocaleString("es-MX")}</span></div><div class="order-items">${(o.items || []).map((i) => `${esc(i.name)} × ${i.quantity}`).join(" · ")}${o.note ? `<br>Nota: ${esc(o.note)}` : ""}</div><div class="order-bottom"><select onchange="setOrderStatus('${escAttr(o.id)}', this.value)"><option value="recibido"${o.status === "recibido" ? " selected" : ""}>recibido</option><option value="en_preparacion"${o.status === "en_preparacion" ? " selected" : ""}>en preparación</option><option value="listo"${o.status === "listo" ? " selected" : ""}>listo</option><option value="entregado"${o.status === "entregado" ? " selected" : ""}>entregado</option></select><span>${money(o.total)}</span></div></article>`,
        )
        .join("")
    : '<div class="empty">Todavía no hay pedidos.</div>';
}
function openModal(p = null) {
  state.editingId = p?.id || null;
  $("modalTitle").textContent = p ? "Editar producto" : "Nuevo producto";
  $("f_id").value = p?.id || "";
  $("f_id").disabled = !!p;
  $("f_name").value = p?.name || "";
  $("f_category").value = p?.category || "hot-drinks";
  $("f_price").value = p?.price ?? "";
  $("f_description").value = p?.description || "";
  $("f_imageUrl").value = p?.imageUrl || "";
  $("formError").textContent = "";
  $("modal").classList.remove("hidden");
}
function closeModal() {
  $("modal").classList.add("hidden");
}
async function saveProduct(ev) {
  ev.preventDefault();
  $("formError").textContent = "";
  const p = {
    id: $("f_id").value.trim(),
    category: $("f_category").value,
    name: $("f_name").value.trim(),
    description: $("f_description").value.trim(),
    price: Number($("f_price").value),
  };
  const image = $("f_imageUrl").value.trim();
  if (image) p.imageUrl = image;
  try {
    if (isSupabase()) {
      const row = {
        id: p.id,
        category: p.category,
        name: p.name,
        description: p.description,
        price: p.price,
        image_url: image || null,
      };
      if (state.editingId) {
        await supabaseFetch("/rest/v1/products?id=eq." + encodeURIComponent(state.editingId), {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(row),
        });
        toast("Producto actualizado");
      } else {
        await supabaseFetch("/rest/v1/products", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(row),
        });
        toast("Producto agregado");
      }
    } else if (state.editingId) {
      await request("/api/products/" + encodeURIComponent(state.editingId), {
        method: "PUT",
        body: JSON.stringify(p),
      });
      toast("Producto actualizado");
    } else {
      await request("/api/products", { method: "POST", body: JSON.stringify(p) });
      toast("Producto agregado");
    }
    closeModal();
    await load();
  } catch (e) {
    $("formError").textContent = e.message;
  }
}
window.editProduct = (id) => {
  const p = state.products.find((x) => x.id === id);
  if (p) openModal(p);
};
window.removeProduct = async (id) => {
  const p = state.products.find((x) => x.id === id);
  if (!p || !confirm(`¿Eliminar “${p.name}”?`)) return;
  try {
    if (isSupabase()) {
      await supabaseFetch("/rest/v1/products?id=eq." + encodeURIComponent(id), { method: "DELETE" });
    } else {
      await request("/api/products/" + encodeURIComponent(id), { method: "DELETE" });
    }
    toast("Producto eliminado");
    await load();
  } catch (e) {
    toast(e.message);
  }
};
window.setOrderStatus = async (id, status) => {
  try {
    if (isSupabase()) {
      await supabaseFetch("/rest/v1/orders?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status }),
      });
    } else {
      toast("Cambia a Supabase para actualizar estados.");
      return;
    }
    toast("Estado actualizado");
    await load();
  } catch (e) {
    toast(e.message);
  }
};
function nav(view) {
  document.querySelectorAll(".view").forEach((x) => x.classList.remove("active-view"));
  $(view).classList.add("active-view");
  document.querySelectorAll(".nav-item").forEach((x) => x.classList.toggle("active", x.dataset.view === view));
  $("pageTitle").textContent = { dashboard: "Resumen", products: "Productos", orders: "Pedidos" }[view];
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}
function escAttr(s) {
  return esc(s).replace(/`/g, "&#096;");
}
function escapeAttr(s) {
  return escAttr(s);
}
document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => nav(b.dataset.view)));
$("saveApi").onclick = () => {
  state.api = $("apiUrl").value.trim().replace(/\/$/, "");
  state.anonKey = ($("anonKey")?.value || "").trim();
  localStorage.setItem("cafetecApi", state.api);
  localStorage.setItem("cafetecAnonKey", state.anonKey);
  load();
};
$("refresh").onclick = load;
$("search").oninput = renderProducts;
$("categoryFilter").onchange = renderProducts;
$("newProduct").onclick = () => openModal();
$("closeModal").onclick = closeModal;
$("cancelForm").onclick = closeModal;
$("productForm").onsubmit = saveProduct;
$("modal").addEventListener("click", (e) => {
  if (e.target === $("modal")) closeModal();
});
load();
