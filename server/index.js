const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const port = Number(process.env.PORT) || 3000;
const catalog = require(path.join(__dirname, "../src/data/products.json"));
const products = catalog.map((product) => ({ ...product }));
const ordersPath = path.join(__dirname, "orders.json");

function loadOrders() {
  try {
    const parsed = JSON.parse(fs.readFileSync(ordersPath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOrders(list) {
  fs.writeFileSync(ordersPath, JSON.stringify(list, null, 2));
}

const orders = loadOrders();

function publicProduct(product) {
  const { imageFile, ...rest } = product;
  return rest;
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(body == null ? "" : JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        reject(new Error("El cuerpo de la solicitud es demasiado grande."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("El cuerpo debe ser JSON válido."));
      }
    });
    request.on("error", reject);
  });
}

function validateProduct(body) {
  const validImageUrl = body.imageUrl === undefined ||
    (typeof body.imageUrl === "string" && /^https?:\/\/\S+$/i.test(body.imageUrl));
  if (
    !body ||
    typeof body.id !== "string" ||
    typeof body.category !== "string" ||
    typeof body.name !== "string" ||
    typeof body.description !== "string" ||
    typeof body.price !== "number" ||
    !Number.isFinite(body.price) ||
    body.price < 0 ||
    !validImageUrl
  ) {
    return "Se requieren id, category, name, description y price numérico; imageUrl debe ser una URL http(s).";
  }
  return null;
}

function createOrderFromBody(body) {
  const customerName = typeof body?.customerName === "string" ? body.customerName.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  if (!customerName || customerName.length > 80) {
    throw new Error("Indica un nombre de hasta 80 caracteres.");
  }
  if (note.length > 300) {
    throw new Error("La nota no puede pasar de 300 caracteres.");
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new Error("El pedido necesita al menos un producto.");
  }
  if (body.items.length > 3) {
    throw new Error("El pedido no puede tener más de 3 líneas.");
  }

  const items = body.items.map((item) => {
    const productId = typeof item?.productId === "string" ? item.productId : "";
    const quantity = Number(item?.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Cada producto necesita productId y quantity entera mayor a 0.");
    }
    const product = products.find((entry) => entry.id === productId);
    if (!product) {
      throw new Error(`No existe el producto ${productId}.`);
    }
    return {
      productId: product.id,
      name: product.name,
      quantity,
      unitPrice: product.price,
      lineTotal: product.price * quantity,
    };
  });

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity > 3) {
    throw new Error("Máximo 3 productos por pedido.");
  }

  const numbers = orders
    .map((order) => Number(String(order.id).replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return {
    id: `ord-${String(next).padStart(4, "0")}`,
    createdAt: new Date().toISOString(),
    customerName,
    note,
    status: "recibido",
    items,
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, null);
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
  const orderMatch = url.pathname.match(/^\/api\/orders\/([^/]+)$/);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/products") {
    const category = url.searchParams.get("category");
    const result = category
      ? products.filter((product) => product.category === category)
      : products;
    sendJson(response, 200, result.map(publicProduct));
    return;
  }

  if (request.method === "GET" && productMatch) {
    const product = products.find((item) => item.id === productMatch[1]);
    sendJson(response, product ? 200 : 404, product ? publicProduct(product) : { error: "Producto no encontrado." });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/products") {
    try {
      const body = await readJson(request);
      const validationError = validateProduct(body);
      if (validationError) {
        sendJson(response, 400, { error: validationError });
        return;
      }
      if (products.some((product) => product.id === body.id)) {
        sendJson(response, 409, { error: "Ya existe un producto con ese id." });
        return;
      }
      products.push(body);
      sendJson(response, 201, publicProduct(body));
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  if (request.method === "PUT" && productMatch) {
    try {
      const body = await readJson(request);
      const validationError = validateProduct(body);
      const index = products.findIndex((item) => item.id === productMatch[1]);
      if (validationError) {
        sendJson(response, 400, { error: validationError });
        return;
      }
      if (index === -1) {
        sendJson(response, 404, { error: "Producto no encontrado." });
        return;
      }
      products[index] = { ...body, id: productMatch[1] };
      sendJson(response, 200, publicProduct(products[index]));
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  if (request.method === "DELETE" && productMatch) {
    const index = products.findIndex((item) => item.id === productMatch[1]);
    if (index === -1) {
      sendJson(response, 404, { error: "Producto no encontrado." });
      return;
    }
    products.splice(index, 1);
    sendJson(response, 204, null);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/orders") {
    const idsParam = url.searchParams.get("ids");
    if (idsParam) {
      const wanted = new Set(idsParam.split(",").map((id) => id.trim()).filter(Boolean));
      sendJson(response, 200, orders.filter((order) => wanted.has(order.id)));
      return;
    }
    sendJson(response, 200, orders);
    return;
  }

  if (request.method === "GET" && orderMatch) {
    const order = orders.find((item) => item.id === decodeURIComponent(orderMatch[1]));
    sendJson(response, order ? 200 : 404, order || { error: "Pedido no encontrado." });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/orders") {
    try {
      const body = await readJson(request);
      const order = createOrderFromBody(body);
      orders.unshift(order);
      saveOrders(orders);
      sendJson(response, 201, order);
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  sendJson(response, 404, { error: "Ruta no encontrada." });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`CafeTec API disponible en http://localhost:${port}`);
});
