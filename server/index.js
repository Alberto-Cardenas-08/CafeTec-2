const http = require("node:http");

const port = Number(process.env.PORT) || 3000;
const products = [
  {
    id: "lunch-club-sandwich",
    category: "lunch",
    name: "Club Sandwich",
    description: "Pan tostado, pollo, jamón, queso y vegetales.",
    price: 75,
  },
  {
    id: "lunch-baguette-pollo",
    category: "lunch",
    name: "Baguette de Pollo",
    description: "Baguette con pollo, queso y vegetales frescos.",
    price: 72,
  },
  {
    id: "lunch-croissant",
    category: "lunch",
    name: "Croissant",
    description: "Croissant de mantequilla relleno de jamón y queso.",
    price: 55,
  },
  {
    id: "lunch-wrap-vegetariano",
    category: "lunch",
    name: "Wrap Vegetariano",
    description: "Lechuga, tomate, queso y vegetales frescos.",
    price: 60,
  },
  {
    id: "lunch-ensalada-cesar",
    category: "lunch",
    name: "Ensalada César",
    description: "Lechuga fresca, pollo, queso y aderezo César.",
    price: 65,
  },
  { id: "hot-espresso", category: "hot-drinks", name: "Café Espresso", description: "Café Espresso 100% Arábica, intenso y aromático", price: 28 },
  { id: "hot-americano", category: "hot-drinks", name: "Americano", description: "Café Espresso con agua caliente", price: 32 },
  { id: "hot-capuchino", category: "hot-drinks", name: "Capuchino", description: "Espresso con leche Espumada", price: 38 },
  { id: "hot-latte", category: "hot-drinks", name: "Latte", description: "Espresso con leche suave y cremosa", price: 40 },
  { id: "hot-chocolate", category: "hot-drinks", name: "Chocolate Caliente", description: "Chocolate velga con leche", price: 36 },
  { id: "cold-iced-coffee", category: "cold-drinks", name: "Iced Coffee", description: "Café frío con hielo.", price: 42 },
  { id: "cold-iced-latte", category: "cold-drinks", name: "Iced Latte", description: "Latte frío con hielo.", price: 45 },
  { id: "cold-iced-tea", category: "cold-drinks", name: "Té Helado", description: "Té refrescante con hielo.", price: 35 },
  { id: "cold-red-berry-lemonade", category: "cold-drinks", name: "Limonada Frutos Rojos", description: "Limonada con mezcla de frutos rojos.", price: 38 },
  { id: "cold-natural-lemonade", category: "cold-drinks", name: "Limonada Natural", description: "Limonada clásica y refrescante.", price: 32 },
  { id: "frappe-caramel", category: "frappes", name: "Frappe Caramelo", description: "Café, leche, hielo y caramelo.", price: 55 },
  { id: "frappe-mocha", category: "frappes", name: "Frappe Mocha", description: "Chocolate, café y crema.", price: 58 },
  { id: "frappe-vanilla", category: "frappes", name: "Frappe Vainilla", description: "Café con vainilla y crema.", price: 55 },
  { id: "frappe-cookies", category: "frappes", name: "Frappe Cookies & Cream", description: "Café con galleta y crema.", price: 58 },
  { id: "frappe-chocolate", category: "frappes", name: "Frappe Chocolate", description: "Chocolate, leche y hielo.", price: 55 },
];

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(body));
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

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, null);
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/products") {
    const category = url.searchParams.get("category");
    const result = category
      ? products.filter((product) => product.category === category)
      : products;
    sendJson(response, 200, result);
    return;
  }

  if (request.method === "GET" && productMatch) {
    const product = products.find((item) => item.id === productMatch[1]);
    sendJson(response, product ? 200 : 404, product || { error: "Producto no encontrado." });
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
      sendJson(response, 201, body);
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
      sendJson(response, 200, products[index]);
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

  sendJson(response, 404, { error: "Ruta no encontrada." });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`CafeTec API disponible en http://localhost:${port}`);
});
