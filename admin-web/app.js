const DEFAULT_URL = "https://afqycxwuvzmksompycco.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_fNmkRCGiZqwi5hrTJgFjiA_oM77mn8s";
const CATEGORY_PREFIX = {
  "hot-drinks": "hot",
  "cold-drinks": "cold",
  frappes: "frappe",
  lunch: "lunch",
};
const state = {
  products: [],
  categories: [],
  orders: [],
  editingId: null,
  editingCategoryId: null,
  isOpen: true,
  orderFilter: "all",
  orderDate: "",
  corteFrom: "",
  corteTo: "",
  ticketDate: "",
  ticketId: "",
  api: DEFAULT_URL,
  anonKey: DEFAULT_ANON_KEY,
  session: null,
  client: null,
  channel: null,
};
const $ = (id) => document.getElementById(id);
const categoryNames = {
  "hot-drinks": "Bebidas calientes",
  "cold-drinks": "Bebidas frías",
  frappes: "Frappes",
  lunch: "Lunch",
};

function money(n) {
  return Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayKey() {
  return dayKey(new Date());
}
function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "producto";
}
function makeProductId(category, name) {
  const prefix = CATEGORY_PREFIX[category] || "item";
  let id = `${prefix}-${slugify(name)}`;
  let n = 2;
  while (state.products.some((p) => p.id === id) && id !== state.editingId) {
    id = `${prefix}-${slugify(name)}-${n}`;
    n += 1;
  }
  return id;
}
function ordersForDay(date, includeCancelled = true) {
  return ordersInRange(date, date, includeCancelled);
}
function ordersInRange(from, to, includeCancelled = true) {
  const start = from || todayKey();
  const end = to || start;
  const lo = start <= end ? start : end;
  const hi = start <= end ? end : start;
  return state.orders.filter((o) => {
    const key = dayKey(o.createdAt);
    if (key < lo || key > hi) return false;
    if (!includeCancelled && o.status === "cancelado") return false;
    return true;
  });
}
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
function makeClient() {
  if (!window.supabase) throw new Error("No cargó Supabase.");
  if (!state.anonKey) throw new Error("Pega la anon / publishable key.");
  return window.supabase.createClient(state.api, state.anonKey, {
    auth: { persistSession: true, storageKey: "cafetec-admin-auth" },
  });
}
function mapProduct(p) {
  return {
    id: p.id,
    category: p.category,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    imageUrl: p.image_url || p.imageUrl,
    available: p.available !== false,
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
function showApp(show) {
  $("loginGate").style.display = show ? "none" : "grid";
  document.querySelector(".app-shell").style.display = show ? "flex" : "none";
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {}
}

async function ensureSession() {
  state.client = makeClient();
  const { data } = await state.client.auth.getSession();
  state.session = data.session;
  showApp(Boolean(state.session));
  if (state.session) {
    await load();
    listenRealtime();
  }
}

async function load() {
  setConnection(false, "Conectando…");
  try {
    const [{ data: products, error: pErr }, { data: orders, error: oErr }, { data: settings }, catRes] = await Promise.all([
      state.client.from("products").select("*").order("name"),
      state.client.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      state.client.from("cafe_settings").select("is_open").eq("id", 1).maybeSingle(),
      state.client.from("categories").select("*").order("sort_order").order("name"),
    ]);
    if (pErr) throw pErr;
    if (oErr) throw oErr;
    state.products = (products || []).map(mapProduct);
    state.categories = catRes.error ? [] : catRes.data || [];
    state.orders = (orders || []).map(mapOrder);
    fillCategorySelects();
    renderCategories();
    state.isOpen = settings ? settings.is_open !== false : true;
    renderCafeBanner();
    if (!$("orderDate").value) $("orderDate").value = todayKey();
    if (!$("corteFrom").value) $("corteFrom").value = todayKey();
    if (!$("corteTo").value) $("corteTo").value = todayKey();
    if (!$("ticketDate").value) $("ticketDate").value = todayKey();
    state.orderDate = $("orderDate").value;
    state.corteFrom = $("corteFrom").value;
    state.corteTo = $("corteTo").value;
    state.ticketDate = $("ticketDate").value;
    setConnection(true, "Conectado");
    renderProducts();
    renderOrders();
    renderCorte();
    renderTickets();
    renderStats();
  } catch (e) {
    setConnection(false, "Sin conexión");
    $("productsGrid").innerHTML =
      '<div class="empty">No se pudo conectar.<br><small>Corre <b>supabase/mvp.sql</b> y entra con la cuenta de caja.</small></div>';
    $("ordersList").innerHTML = '<div class="empty">No se pudieron cargar los pedidos.</div>';
    renderStats();
  }
}

function listenRealtime() {
  if (state.channel) state.client.removeChannel(state.channel);
  state.channel = state.client
    .channel("admin-live")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
      toast("Nueva orden " + (payload.new?.id || ""));
      beep();
      load();
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => load())
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => load())
    .on("postgres_changes", { event: "*", schema: "public", table: "cafe_settings" }, () => load())
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => load())
    .subscribe();
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
            `<article class="product-card ${p.available ? "" : "is-soldout"}"><div class="product-image">${p.imageUrl ? `<img src="${escapeAttr(p.imageUrl)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">` : ""}<span class="product-placeholder" ${p.imageUrl ? 'style="display:none"' : ""}>☕</span></div><div class="product-body"><h4>${esc(p.name)}</h4><p>${esc(p.description)}</p><div class="product-meta"><span class="price">${money(p.price)}</span><span class="badge">${esc(categoryLabel(p.category))}</span></div><div class="stock-row"><button type="button" class="stock-switch ${p.available ? "on" : ""}" onclick="toggleAvailable('${escAttr(p.id)}')"><span class="knob"></span></button><span class="stock-text ${p.available ? "ok" : "off"}">${p.available ? "Disponible" : "Agotado"}</span></div><div class="product-actions"><button onclick="editProduct('${escAttr(p.id)}')">✏️ Editar</button><button class="danger" onclick="removeProduct('${escAttr(p.id)}')">Agotar</button></div></div></article>`,
        )
        .join("")
    : '<div class="empty">No hay productos con esos filtros.</div>';
}
const ORDER_STATUS_BUBBLES = [
  { id: "recibido", label: "Pendiente" },
  { id: "en_preparacion", label: "En preparación" },
  { id: "listo", label: "Listo" },
  { id: "entregado", label: "Entregado" },
  { id: "cancelado", label: "Cancelado" },
];
function statusBubbles(orderId, current) {
  return `<div class="status-bubbles">${ORDER_STATUS_BUBBLES.map(
    (s) =>
      `<button type="button" class="status-bubble status-${s.id}${current === s.id ? " is-active" : ""}" onclick="setOrderStatus('${escAttr(orderId)}','${s.id}')">${s.label}</button>`,
  ).join("")}</div>`;
}
function orderItemLine(item) {
  const product = state.products.find((p) => p.id === item.productId);
  const catId = product?.category;
  const catName = catId ? categoryLabel(catId) : "";
  return `<div class="order-line"><span>${esc(item.name)} × ${item.quantity}</span>${
    catName ? `<span class="cat-bubble">${esc(catName)}</span>` : ""
  }</div>`;
}
function renderOrders() {
  const ofDay = ordersForDay(state.orderDate || todayKey(), true);
  const list =
    state.orderFilter === "all" ? ofDay : ofDay.filter((o) => o.status === state.orderFilter);
  $("ordersCount").textContent = list.length;
  $("ordersList").innerHTML = list.length
    ? list
        .map(
          (o) =>
            `<article class="order"><div class="order-top"><strong>${esc(o.id)}${o.customerName ? " · " + esc(o.customerName) : ""}</strong><span>${new Date(o.createdAt).toLocaleString("es-MX")}</span></div><div class="order-items">${(o.items || []).map(orderItemLine).join("")}${o.note ? `<div class="order-note">Nota: ${esc(o.note)}</div>` : ""}</div>${statusBubbles(o.id, o.status)}<div class="order-bottom"><button type="button" class="secondary" onclick="openTicket('${escAttr(o.id)}')">Ticket</button><span>${money(o.total)}</span></div></article>`,
        )
        .join("")
    : '<div class="empty">No hay pedidos en este día / filtro.</div>';
}
function renderCafeBanner() {
  const open = state.isOpen;
  const btn = $("cafeToggle");
  btn.className = "cafe-banner " + (open ? "is-open" : "is-closed");
  $("cafeBannerTitle").textContent = open ? "Cafetería abierta" : "Cafetería cerrada";
  $("cafeBannerText").textContent = open
    ? "Los alumnos ya pueden pedir"
    : "El menú se ve, pero no se reciben pedidos";
}
function statusName(status) {
  return (
    {
      recibido: "Pendiente",
      en_preparacion: "En preparación",
      listo: "Listo",
      entregado: "Entregado",
      cancelado: "Cancelado",
    }[status] || status
  );
}
function getCorteData() {
  const from = state.corteFrom || todayKey();
  const to = state.corteTo || from;
  const sold = ordersInRange(from, to, false);
  const cancelled = ordersInRange(from, to, true).filter((o) => o.status === "cancelado");
  const rangeLabel = from === to ? from : `${from} a ${to}`;
  const lines = {};
  const byCategory = {};
  const byDay = {};
  const details = [];
  const cancelledDetails = [];
  let pieces = 0;
  for (const order of sold) {
    const day = dayKey(order.createdAt);
    if (!byDay[day]) byDay[day] = { day, orders: 0, total: 0, pieces: 0 };
    byDay[day].orders += 1;
    byDay[day].total += Number(order.total || 0);
    for (const item of order.items || []) {
      const qty = Number(item.quantity || 0);
      const lineTotal = Number(item.lineTotal || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const product = state.products.find((p) => p.id === item.productId);
      const category = product ? categoryLabel(product.category) : "Sin categoría";
      pieces += qty;
      byDay[day].pieces += qty;
      if (!lines[item.name]) lines[item.name] = { name: item.name, category, quantity: 0, total: 0 };
      lines[item.name].quantity += qty;
      lines[item.name].total += lineTotal;
      if (!byCategory[category]) byCategory[category] = { name: category, quantity: 0, total: 0, orders: new Set() };
      byCategory[category].quantity += qty;
      byCategory[category].total += lineTotal;
      byCategory[category].orders.add(order.id);
      details.push({
        id: order.id,
        date: new Date(order.createdAt).toLocaleString("es-MX"),
        customer: order.customerName || "",
        note: order.note || "",
        status: statusName(order.status),
        category,
        product: item.name,
        quantity: qty,
        unitPrice,
        lineTotal,
        orderTotal: Number(order.total || 0),
      });
    }
  }
  for (const order of cancelled) {
    cancelledDetails.push({
      id: order.id,
      date: new Date(order.createdAt).toLocaleString("es-MX"),
      customer: order.customerName || "",
      note: order.note || "",
      total: Number(order.total || 0),
      products: (order.items || []).map((i) => `${i.quantity}× ${i.name}`).join(", "),
    });
  }
  const rows = Object.values(lines).sort((a, b) => b.total - a.total);
  const categories = Object.values(byCategory)
    .map((c) => ({ ...c, orders: c.orders.size }))
    .sort((a, b) => b.total - a.total);
  const days = Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
  const total = sold.reduce((s, o) => s + Number(o.total || 0), 0);
  const ticket = sold.length ? total / sold.length : 0;
  return {
    from,
    to,
    rangeLabel,
    sold,
    cancelled,
    rows,
    categories,
    days,
    details,
    cancelledDetails,
    total,
    ticket,
    pieces,
  };
}
function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function xmlCell(value, type = "String", style, merge) {
  const attrs = [];
  if (style) attrs.push(`ss:StyleID="${style}"`);
  if (merge) attrs.push(`ss:MergeAcross="${merge}"`);
  return `<Cell ${attrs.join(" ")}><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`;
}
function xmlRow(cells, style) {
  return `<Row${style ? ` ss:StyleID="${style}"` : ""}>${cells.join("")}</Row>`;
}
function xmlCols(widths) {
  return widths.map((w) => `<Column ss:AutoFitWidth="0" ss:Width="${w}"/>`).join("");
}
function xmlSheet(name, columns, rows, freezeRow = 0) {
  const freeze = freezeRow
    ? `<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>${freezeRow}</SplitHorizontal><TopRowBottomPane>${freezeRow}</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions>`
    : "";
  return `<Worksheet ss:Name="${xmlEscape(name)}"><Table>${xmlCols(columns)}${rows}</Table>${freeze}</Worksheet>`;
}
function downloadCorteExcel() {
  const data = getCorteData();
  const generado = new Date().toLocaleString("es-MX");
  const cancelPct = data.sold.length + data.cancelled.length
    ? data.cancelled.length / (data.sold.length + data.cancelled.length)
    : 0;
  const resumen = [
    xmlRow([xmlCell("CAFETEC", "String", "title", 3)]),
    xmlRow([xmlCell("Corte de ventas — cafetería", "String", "subtitle", 3)]),
    xmlRow([xmlCell("")]),
    xmlRow([xmlCell("Periodo", "String", "label"), xmlCell(data.rangeLabel, "String", "text", 2)]),
    xmlRow([xmlCell("Generado", "String", "label"), xmlCell(generado, "String", "text", 2)]),
    xmlRow([xmlCell("Origen", "String", "label"), xmlCell("Aplicación móvil CafeTec", "String", "text", 2)]),
    xmlRow([xmlCell("")]),
    xmlRow([xmlCell("Indicadores", "String", "section", 3)]),
    xmlRow([xmlCell("Concepto", "String", "head"), xmlCell("Valor", "String", "head")]),
    xmlRow([xmlCell("Pedidos cobrados"), xmlCell(data.sold.length, "Number", "int")]),
    xmlRow([xmlCell("Piezas vendidas"), xmlCell(data.pieces, "Number", "int")]),
    xmlRow([xmlCell("Ticket promedio"), xmlCell(data.ticket, "Number", "money")]),
    xmlRow([xmlCell("Pedidos cancelados"), xmlCell(data.cancelled.length, "Number", "int")]),
    xmlRow([xmlCell("% cancelados"), xmlCell(cancelPct, "Number", "pct")]),
    xmlRow([xmlCell("TOTAL VENDIDO"), xmlCell(data.total, "Number", "moneyTotal")]),
    xmlRow([xmlCell("")]),
    xmlRow([xmlCell("Los pedidos cancelados no se incluyen en el total vendido.", "String", "note", 3)]),
  ].join("");
  const porDia = [
    xmlRow([xmlCell("Ventas por día", "String", "title", 3)]),
    xmlRow([
      xmlCell("Fecha", "String", "head"),
      xmlCell("Pedidos", "String", "head"),
      xmlCell("Piezas", "String", "head"),
      xmlCell("Importe", "String", "head"),
    ]),
    ...data.days.map((d) =>
      xmlRow([
        xmlCell(d.day),
        xmlCell(d.orders, "Number", "int"),
        xmlCell(d.pieces, "Number", "int"),
        xmlCell(d.total, "Number", "money"),
      ]),
    ),
    xmlRow([
      xmlCell("TOTAL", "String", "total"),
      xmlCell(data.sold.length, "Number", "intTotal"),
      xmlCell(data.pieces, "Number", "intTotal"),
      xmlCell(data.total, "Number", "moneyTotal"),
    ]),
  ].join("");
  const productos = [
    xmlRow([xmlCell("Ventas por producto", "String", "title", 5)]),
    xmlRow([
      xmlCell("#", "String", "head"),
      xmlCell("Producto", "String", "head"),
      xmlCell("Categoría", "String", "head"),
      xmlCell("Cantidad", "String", "head"),
      xmlCell("Importe", "String", "head"),
      xmlCell("% del total", "String", "head"),
    ]),
    ...data.rows.map((r, i) =>
      xmlRow([
        xmlCell(i + 1, "Number", "int"),
        xmlCell(r.name),
        xmlCell(r.category),
        xmlCell(r.quantity, "Number", "int"),
        xmlCell(r.total, "Number", "money"),
        xmlCell(data.total ? r.total / data.total : 0, "Number", "pct"),
      ]),
    ),
    xmlRow([
      xmlCell(""),
      xmlCell("TOTAL", "String", "total"),
      xmlCell(""),
      xmlCell(data.pieces, "Number", "intTotal"),
      xmlCell(data.total, "Number", "moneyTotal"),
      xmlCell(1, "Number", "pctTotal"),
    ]),
  ].join("");
  const categorias = [
    xmlRow([xmlCell("Ventas por categoría", "String", "title", 4)]),
    xmlRow([
      xmlCell("Categoría", "String", "head"),
      xmlCell("Pedidos", "String", "head"),
      xmlCell("Piezas", "String", "head"),
      xmlCell("Importe", "String", "head"),
      xmlCell("% del total", "String", "head"),
    ]),
    ...data.categories.map((c) =>
      xmlRow([
        xmlCell(c.name),
        xmlCell(c.orders, "Number", "int"),
        xmlCell(c.quantity, "Number", "int"),
        xmlCell(c.total, "Number", "money"),
        xmlCell(data.total ? c.total / data.total : 0, "Number", "pct"),
      ]),
    ),
    xmlRow([
      xmlCell("TOTAL", "String", "total"),
      xmlCell(""),
      xmlCell(data.pieces, "Number", "intTotal"),
      xmlCell(data.total, "Number", "moneyTotal"),
      xmlCell(1, "Number", "pctTotal"),
    ]),
  ].join("");
  const pedidos = [
    xmlRow([xmlCell("Detalle de pedidos cobrados", "String", "title", 8)]),
    xmlRow([
      xmlCell("Orden", "String", "head"),
      xmlCell("Fecha y hora", "String", "head"),
      xmlCell("Cliente", "String", "head"),
      xmlCell("Estado", "String", "head"),
      xmlCell("Categoría", "String", "head"),
      xmlCell("Producto", "String", "head"),
      xmlCell("Cantidad", "String", "head"),
      xmlCell("P. unitario", "String", "head"),
      xmlCell("Importe línea", "String", "head"),
      xmlCell("Total orden", "String", "head"),
      xmlCell("Nota", "String", "head"),
    ]),
    ...data.details.map((d) =>
      xmlRow([
        xmlCell(d.id),
        xmlCell(d.date),
        xmlCell(d.customer),
        xmlCell(d.status),
        xmlCell(d.category),
        xmlCell(d.product),
        xmlCell(d.quantity, "Number", "int"),
        xmlCell(d.unitPrice, "Number", "money"),
        xmlCell(d.lineTotal, "Number", "money"),
        xmlCell(d.orderTotal, "Number", "money"),
        xmlCell(d.note),
      ]),
    ),
  ].join("");
  const cancelados = [
    xmlRow([xmlCell("Pedidos cancelados (no entran al total)", "String", "title", 4)]),
    xmlRow([
      xmlCell("Orden", "String", "head"),
      xmlCell("Fecha y hora", "String", "head"),
      xmlCell("Cliente", "String", "head"),
      xmlCell("Productos", "String", "head"),
      xmlCell("Total", "String", "head"),
      xmlCell("Nota", "String", "head"),
    ]),
    ...(data.cancelledDetails.length
      ? data.cancelledDetails.map((d) =>
          xmlRow([
            xmlCell(d.id),
            xmlCell(d.date),
            xmlCell(d.customer),
            xmlCell(d.products),
            xmlCell(d.total, "Number", "money"),
            xmlCell(d.note),
          ]),
        )
      : [xmlRow([xmlCell("Sin cancelaciones en este periodo.", "String", "note", 4)])]),
  ].join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="title"><Font ss:Bold="1" ss:Size="16" ss:Color="#FFFFFF"/><Interior ss:Color="#57301C" ss:Pattern="Solid"/></Style>
    <Style ss:ID="subtitle"><Font ss:Bold="1" ss:Size="12" ss:Color="#57301C"/></Style>
    <Style ss:ID="section"><Font ss:Bold="1" ss:Size="12" ss:Color="#FFFFFF"/><Interior ss:Color="#D07F30" ss:Pattern="Solid"/></Style>
    <Style ss:ID="head"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#57301C" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
    <Style ss:ID="label"><Font ss:Bold="1" ss:Color="#57301C"/></Style>
    <Style ss:ID="text"/>
    <Style ss:ID="note"><Font ss:Italic="1" ss:Color="#795E4D"/></Style>
    <Style ss:ID="int"><NumberFormat ss:Format="#,##0"/></Style>
    <Style ss:ID="money"><NumberFormat ss:Format="&quot;$&quot;#,##0.00"/></Style>
    <Style ss:ID="pct"><NumberFormat ss:Format="0.0%"/></Style>
    <Style ss:ID="total"><Font ss:Bold="1"/><Interior ss:Color="#F3E6D6" ss:Pattern="Solid"/></Style>
    <Style ss:ID="intTotal"><Font ss:Bold="1"/><Interior ss:Color="#F3E6D6" ss:Pattern="Solid"/><NumberFormat ss:Format="#,##0"/></Style>
    <Style ss:ID="moneyTotal"><Font ss:Bold="1"/><Interior ss:Color="#F3E6D6" ss:Pattern="Solid"/><NumberFormat ss:Format="&quot;$&quot;#,##0.00"/></Style>
    <Style ss:ID="pctTotal"><Font ss:Bold="1"/><Interior ss:Color="#F3E6D6" ss:Pattern="Solid"/><NumberFormat ss:Format="0.0%"/></Style>
  </Styles>
  ${xmlSheet("Resumen", [160, 90, 90, 110], resumen)}
  ${xmlSheet("Por día", [90, 80, 80, 110], porDia, 2)}
  ${xmlSheet("Por producto", [30, 160, 120, 80, 100, 90], productos, 2)}
  ${xmlSheet("Por categoría", [140, 80, 80, 100, 90], categorias, 2)}
  ${xmlSheet("Pedidos", [80, 130, 90, 90, 110, 150, 70, 90, 90, 90, 140], pedidos, 2)}
  ${xmlSheet("Cancelados", [80, 130, 90, 220, 90, 140], cancelados, 2)}
</Workbook>`;
  const blob = new Blob(["\uFEFF" + xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `CafeTec-corte-${data.from}_a_${data.to}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast("Excel profesional descargado");
}
function renderCorte() {
  const data = getCorteData();
  $("corteSummary").innerHTML = `
    <article class="stat-card"><div class="stat-top"><span>Pedidos cobrados</span></div><strong>${data.sold.length}</strong><small>${esc(data.rangeLabel)}</small></article>
    <article class="stat-card"><div class="stat-top"><span>Cancelados</span></div><strong>${data.cancelled.length}</strong><small>no entran al corte</small></article>
    <article class="stat-card"><div class="stat-top"><span>Total vendido</span></div><strong>${money(data.total)}</strong><small>aplicación CafeTec</small></article>
  `;
  $("corteTable").innerHTML = data.rows.length
    ? `<table class="corte-table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Importe</th></tr></thead><tbody>${data.rows
        .map((r) => `<tr><td>${esc(r.name)}</td><td>${r.quantity}</td><td>${money(r.total)}</td></tr>`)
        .join("")}</tbody><tfoot><tr><td>Total</td><td></td><td>${money(data.total)}</td></tr></tfoot></table>`
    : '<div class="empty">No hubo ventas de la app en este periodo.</div>';
  $("cortePrint").innerHTML = `
    <div class="print-head">
      <h1>CafeTec</h1>
      <h2>Corte de ventas</h2>
      <p><strong>Periodo:</strong> ${esc(data.rangeLabel)}</p>
      <p><strong>Generado:</strong> ${esc(new Date().toLocaleString("es-MX"))}</p>
    </div>
    <table class="corte-table">
      <thead><tr><th>Concepto</th><th>Valor</th></tr></thead>
      <tbody>
        <tr><td>Pedidos cobrados</td><td>${data.sold.length}</td></tr>
        <tr><td>Pedidos cancelados</td><td>${data.cancelled.length}</td></tr>
        <tr><td>Total vendido</td><td>${money(data.total)}</td></tr>
      </tbody>
    </table>
    <h3>Ventas por producto</h3>
    ${
      data.rows.length
        ? `<table class="corte-table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Importe</th></tr></thead><tbody>${data.rows
            .map((r) => `<tr><td>${esc(r.name)}</td><td>${r.quantity}</td><td>${money(r.total)}</td></tr>`)
            .join("")}</tbody><tfoot><tr><td>Total</td><td></td><td>${money(data.total)}</td></tr></tfoot></table>`
        : "<p>Sin ventas en este periodo.</p>"
    }
    <h3>Detalle de pedidos</h3>
    ${
      data.details.length
        ? `<table class="corte-table"><thead><tr><th>Orden</th><th>Fecha</th><th>Producto</th><th>Cant.</th><th>P. unit.</th><th>Importe</th></tr></thead><tbody>${data.details
            .map(
              (d) =>
                `<tr><td>${esc(d.id)}</td><td>${esc(d.date)}</td><td>${esc(d.product)}</td><td>${d.quantity}</td><td>${money(d.unitPrice)}</td><td>${money(d.lineTotal)}</td></tr>`,
            )
            .join("")}</tbody></table>`
        : "<p>Sin detalle.</p>"
    }
  `;
}
function openModal(p = null) {
  state.editingId = p?.id || null;
  $("modalTitle").textContent = p ? "Editar producto" : "Nuevo producto";
  $("f_id").value = p?.id || "";
  $("f_id").disabled = true;
  $("idField").classList.toggle("hidden", !p);
  $("f_name").value = p?.name || "";
  $("f_category").value = p?.category || "hot-drinks";
  $("f_price").value = p?.price ?? "";
  $("f_description").value = p?.description || "";
  $("f_imageUrl").value = p?.imageUrl || "";
  $("f_imageFile").value = "";
  $("f_available").checked = p ? p.available !== false : true;
  $("formError").textContent = "";
  $("modal").classList.remove("hidden");
}
function closeModal() {
  $("modal").classList.add("hidden");
}
async function uploadPhoto(file) {
  const path = `${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const { error } = await state.client.storage.from("product-images").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = state.client.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
async function saveProduct(ev) {
  ev.preventDefault();
  $("formError").textContent = "";
  try {
    let imageUrl = $("f_imageUrl").value.trim();
    const file = $("f_imageFile").files[0];
    if (file) imageUrl = await uploadPhoto(file);
    const name = $("f_name").value.trim();
    const category = $("f_category").value;
    const row = {
      id: state.editingId || makeProductId(category, name),
      category,
      name,
      description: $("f_description").value.trim(),
      price: Number($("f_price").value),
      image_url: imageUrl || null,
      available: $("f_available").checked,
    };
    if (state.editingId) {
      const { id, ...patch } = row;
      const { error } = await state.client.from("products").update(patch).eq("id", state.editingId);
      if (error) throw error;
      toast("Producto actualizado");
    } else {
      const { error } = await state.client.from("products").insert(row);
      if (error) throw error;
      toast("Producto agregado");
    }
    closeModal();
    await load();
  } catch (e) {
    $("formError").textContent = e.message;
  }
}
window.toggleAvailable = async (id) => {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  try {
    const { error } = await state.client.from("products").update({ available: !p.available }).eq("id", id);
    if (error) throw error;
    toast(!p.available ? `${p.name} ya está disponible` : `${p.name} marcado agotado`);
    await load();
  } catch (e) {
    toast(e.message);
  }
};
function openCategoryModal(c = null) {
  state.editingCategoryId = c?.id || null;
  $("categoryModalTitle").textContent = c ? "Editar categoría" : "Nueva categoría";
  $("c_name").value = c?.name || "";
  $("c_description").value = c?.description || "";
  $("c_color").value = c?.color || "#57301c";
  $("c_imageFile").value = "";
  $("categoryFormError").textContent = "";
  $("categoryModal").classList.remove("hidden");
}
function closeCategoryModal() {
  $("categoryModal").classList.add("hidden");
}
window.editCategory = (id) => {
  const c = state.categories.find((x) => x.id === id);
  if (c) openCategoryModal(c);
};
window.removeCategory = async (id) => {
  const c = state.categories.find((x) => x.id === id);
  const used = state.products.some((p) => p.category === id);
  if (!c || !confirm(used ? `“${c.name}” tiene productos. ¿La quitas igual?` : `¿Quitar “${c.name}”?`)) return;
  try {
    const { error } = await state.client.from("categories").delete().eq("id", id);
    if (error) throw error;
    toast("Categoría eliminada");
    await load();
  } catch (e) {
    toast(e.message);
  }
};
async function saveCategory(ev) {
  ev.preventDefault();
  $("categoryFormError").textContent = "";
  try {
    const name = $("c_name").value.trim();
    const file = $("c_imageFile").files[0];
    let imageUrl = state.editingCategoryId
      ? state.categories.find((c) => c.id === state.editingCategoryId)?.image_url || null
      : null;
    if (file) imageUrl = await uploadPhoto(file);
    const row = {
      id: state.editingCategoryId || slugify(name),
      name,
      description: $("c_description").value.trim(),
      color: $("c_color").value || "#57301c",
      image_url: imageUrl,
      sort_order: state.editingCategoryId
        ? state.categories.find((c) => c.id === state.editingCategoryId)?.sort_order || 0
        : state.categories.length + 1,
    };
    if (state.editingCategoryId) {
      const { id, ...patch } = row;
      const { error } = await state.client.from("categories").update(patch).eq("id", state.editingCategoryId);
      if (error) throw error;
      toast("Categoría actualizada");
    } else {
      let id = row.id;
      let n = 2;
      while (state.categories.some((c) => c.id === id)) {
        id = `${row.id}-${n}`;
        n += 1;
      }
      row.id = id;
      const { error } = await state.client.from("categories").insert(row);
      if (error) throw error;
      toast("Categoría creada. Ya aparece en la app.");
    }
    closeCategoryModal();
    await load();
  } catch (e) {
    $("categoryFormError").textContent = e.message;
  }
}
window.editProduct = (id) => {
  const p = state.products.find((x) => x.id === id);
  if (p) openModal(p);
};
window.removeProduct = async (id) => {
  const p = state.products.find((x) => x.id === id);
  if (!p || !confirm(`¿Eliminar o desactivar “${p.name}”? Mejor márcalo agotado si quieres conservarlo.`)) return;
  try {
    const { error } = await state.client.from("products").update({ available: false }).eq("id", id);
    if (error) throw error;
    toast("Producto marcado como agotado");
    await load();
  } catch (e) {
    toast(e.message);
  }
};
window.setOrderStatus = async (id, status) => {
  const current = state.orders.find((o) => o.id === id);
  if (status === "cancelado" && current?.status !== "cancelado") {
    const ok = confirm(`¿Seguro que quieres cancelar la orden ${id}?\nYa no contará en el corte del día.`);
    if (!ok) return;
  }
  try {
    const { error } = await state.client.from("orders").update({ status }).eq("id", id);
    if (error) throw error;
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
  $("pageTitle").textContent = {
    dashboard: "Resumen",
    products: "Productos",
    orders: "Pedidos",
    corte: "Corte del día",
    categories: "Categorías",
    tickets: "Tickets",
  }[view];
  if (view === "tickets") renderTickets();
}
function ticketHTML(order) {
  const when = new Date(order.createdAt).toLocaleString("es-MX");
  const lines = (order.items || [])
    .map((item) => {
      const qty = Number(item.quantity || 0);
      const unit = Number(item.unitPrice || 0);
      const line = Number(item.lineTotal || qty * unit);
      return `<div class="t-row"><span>${qty} x ${esc(item.name)}</span><span>${money(line)}</span></div>
        <div class="t-sub">${money(unit)} c/u</div>`;
    })
    .join("");
  return `
    <div class="ticket" id="printableTicket">
      <div class="t-brand">CAFETEC</div>
      <div class="t-subhead">Café de especialidad</div>
      <div class="t-line"></div>
      <div class="t-meta"><span>Orden</span><span>${esc(order.id)}</span></div>
      <div class="t-meta"><span>Fecha</span><span>${esc(when)}</span></div>
      <div class="t-meta"><span>Estado</span><span>${esc(statusName(order.status))}</span></div>
      ${order.customerName ? `<div class="t-meta"><span>Cliente</span><span>${esc(order.customerName)}</span></div>` : ""}
      <div class="t-line"></div>
      ${lines}
      <div class="t-line"></div>
      ${order.note ? `<div class="t-note">Nota: ${esc(order.note)}</div><div class="t-line"></div>` : ""}
      <div class="t-total"><span>TOTAL</span><span>${money(order.total)}</span></div>
      <div class="t-line"></div>
      <div class="t-thanks">¡Gracias por tu visita!</div>
      <div class="t-subhead">Conserve este ticket</div>
      <div class="t-barcode">${esc(order.id)}</div>
    </div>
  `;
}
function renderTickets() {
  const list = $("ticketOrders");
  if (!list) return;
  const ofDay = ordersForDay(state.ticketDate || todayKey(), true);
  list.innerHTML = ofDay.length
    ? ofDay
        .map(
          (o) =>
            `<button type="button" class="ticket-order ${state.ticketId === o.id ? "is-active" : ""}" onclick="openTicket('${escAttr(o.id)}')"><strong>${esc(o.id)}</strong><span>${esc(statusName(o.status))} · ${money(o.total)}</span></button>`,
        )
        .join("")
    : '<div class="empty">No hay pedidos en este día.</div>';
  const order = state.orders.find((o) => o.id === state.ticketId);
  $("ticketPreview").innerHTML = order
    ? ticketHTML(order)
    : '<p class="empty">Selecciona un pedido para ver el ticket.</p>';
}
window.openTicket = (id) => {
  state.ticketId = id;
  nav("tickets");
  renderTickets();
};
function clearPrintMode() {
  document.body.classList.remove("printing-ticket", "printing-corte");
}
window.addEventListener("afterprint", clearPrintMode);
function printSelectedTicket() {
  const order = state.orders.find((o) => o.id === state.ticketId);
  if (!order) {
    toast("Elige un pedido primero.");
    return;
  }
  clearPrintMode();
  document.body.classList.add("printing-ticket");
  window.print();
}
function simulateTicket() {
  const order = state.orders.find((o) => o.id === state.ticketId);
  if (!order) {
    toast("Elige un pedido primero.");
    return;
  }
  const paper = $("ticketPaper");
  paper.classList.remove("is-printing");
  void paper.offsetWidth;
  paper.classList.add("is-printing");
  toast("Simulando impresión…");
}
function categoryLabel(id) {
  return state.categories.find((c) => c.id === id)?.name || categoryNames[id] || id;
}
function fillCategorySelects() {
  const options = state.categories
    .map((c) => `<option value="${escAttr(c.id)}">${esc(c.name)}</option>`)
    .join("");
  $("categoryFilter").innerHTML = `<option value="">Todas las categorías</option>${options}`;
  $("f_category").innerHTML = options || `<option value="hot-drinks">Bebidas calientes</option>`;
}
function renderCategories() {
  const grid = $("categoriesGrid");
  if (!grid) return;
  grid.innerHTML = state.categories.length
    ? state.categories
        .map(
          (c) =>
            `<article class="product-card"><div class="product-image" style="background:${escAttr(c.color || "#57301c")}">${c.image_url ? `<img src="${escapeAttr(c.image_url)}" alt="">` : `<span class="product-placeholder">▣</span>`}</div><div class="product-body"><h4>${esc(c.name)}</h4><p>${esc(c.description || "")}</p><div class="product-actions"><button onclick="editCategory('${escAttr(c.id)}')">✏️ Editar</button><button class="danger" onclick="removeCategory('${escAttr(c.id)}')">🗑️ Quitar</button></div></div></article>`,
        )
        .join("")
    : '<div class="empty">Aún no hay categorías. Crea la primera para el menú de la app.</div>';
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
$("logout").onclick = async () => {
  if (state.client) await state.client.auth.signOut();
  state.session = null;
  showApp(false);
};
$("cafeToggle").onclick = async () => {
  try {
    const next = !state.isOpen;
    const { error } = await state.client.from("cafe_settings").update({ is_open: next }).eq("id", 1);
    if (error) throw error;
    state.isOpen = next;
    renderCafeBanner();
    toast(next ? "Cafetería abierta" : "Cafetería cerrada");
  } catch (e) {
    toast(e.message);
  }
};
$("loginForm").onsubmit = async (ev) => {
  ev.preventDefault();
  $("loginError").textContent = "";
  try {
    state.client = makeClient();
    const { data, error } = await state.client.auth.signInWithPassword({
      email: $("loginEmail").value.trim(),
      password: $("loginPassword").value,
    });
    if (error) throw error;
    state.session = data.session;
    showApp(true);
    await load();
    listenRealtime();
  } catch (e) {
    $("loginError").textContent = e.message + " (crea el usuario en Authentication → Users)";
  }
};
$("refresh").onclick = load;
$("search").oninput = renderProducts;
$("categoryFilter").onchange = renderProducts;
$("orderFilter").onclick = (ev) => {
  const btn = ev.target.closest("[data-filter]");
  if (!btn) return;
  state.orderFilter = btn.dataset.filter;
  $("orderFilter").querySelectorAll("[data-filter]").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.filter === state.orderFilter);
  });
  renderOrders();
};
$("orderDate").onchange = () => {
  state.orderDate = $("orderDate").value;
  renderOrders();
};
$("corteFrom").onchange = () => {
  state.corteFrom = $("corteFrom").value;
  renderCorte();
};
$("corteTo").onchange = () => {
  state.corteTo = $("corteTo").value;
  renderCorte();
};
$("printCorte").onclick = () => {
  clearPrintMode();
  document.body.classList.add("printing-corte");
  window.print();
};
$("excelCorte").onclick = downloadCorteExcel;
$("ticketDate").onchange = () => {
  state.ticketDate = $("ticketDate").value;
  renderTickets();
};
$("printTicket").onclick = printSelectedTicket;
$("simulateTicket").onclick = simulateTicket;
$("newProduct").onclick = () => openModal();
$("closeModal").onclick = closeModal;
$("cancelForm").onclick = closeModal;
$("productForm").onsubmit = saveProduct;
$("newCategory").onclick = () => openCategoryModal();
$("closeCategoryModal").onclick = closeCategoryModal;
$("cancelCategory").onclick = closeCategoryModal;
$("categoryForm").onsubmit = saveCategory;
$("categoryModal").addEventListener("click", (e) => {
  if (e.target === $("categoryModal")) closeCategoryModal();
});
$("modal").addEventListener("click", (e) => {
  if (e.target === $("modal")) closeModal();
});
showApp(false);
ensureSession().catch(() => showApp(false));
