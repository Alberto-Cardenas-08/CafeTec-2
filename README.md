# CafeTec

Aplicación de cafetería para el Tecnológico: el **alumno pide desde el celular** y **caja atiende en una página web**. Los datos viven en **Supabase** (nube), no en la laptop.

```text
Alumno (Expo / web)  ──►  Supabase  ◄──  Caja (admin-web)
                              │
                    menú · pedidos · fotos
```

Tecnologías: Expo 57, React Native, TypeScript, Expo Router y Supabase (PostgreSQL + Auth + Storage + Realtime).

---

## Qué hace

### App del alumno

- Consulta el menú (categorías dinámicas, fotos, precio, disponible/agotado).
- Carrito persistente, máximo **3 productos**.
- Pedido con nombre y nota opcional.
- Sigue el estado: Pendiente → En preparación → Listo → Entregado (o Cancelado).
- Puede **cancelar** solo si sigue pendiente (penalización de **2 horas** en ese celular).
- Tras pedir, espera de **2 horas** para volver a pedir en el mismo dispositivo.
- Avisos de estado (notificación + mensaje) y de producto agotado.
- Aviso si **no hay internet**.
- Cafetería abierta/cerrada visible en la app.

### Panel de caja (`admin-web/`)

- Login con correo y contraseña (Supabase Auth).
- Resumen del día: ventas, pedidos, gráfica, más vendidos, alertas de stock.
- CRUD de productos (foto, stock, disponible/agotado).
- Categorías nuevas (nombre, color, foto) que aparecen en la app.
- Pedidos en tiempo real, burbujas de estado, quitar producto agotado del pedido.
- No se puede volver a **Pendiente** si ya está en preparación.
- Corte de ventas (rango de fechas, Excel y PDF).
- Tickets de impresora (vista previa, simular, imprimir).
- Abrir/cerrar la cafetería.

---

## Cómo funciona nuestra API (Supabase)

CafeTec **no monta un Express propio en producción**. La API es la que genera **Supabase** sobre PostgreSQL (PostgREST). Cada tabla se vuelve un recurso HTTP y las reglas de negocio viven en funciones SQL (`rpc`).

### Dirección

```text
https://afqycxwuvzmksompycco.supabase.co
```

| Pieza           | URL                                                     |
| --------------- | ------------------------------------------------------- |
| API REST        | `https://afqycxwuvzmksompycco.supabase.co/rest/v1/`     |
| Funciones (RPC) | `https://afqycxwuvzmksompycco.supabase.co/rest/v1/rpc/` |
| Auth            | `https://afqycxwuvzmksompycco.supabase.co/auth/v1/`     |
| Storage (fotos) | `https://afqycxwuvzmksompycco.supabase.co/storage/v1/`  |
| Realtime        | WebSocket del mismo proyecto                            |

Toda petición lleva la clave pública:

```http
apikey: EXPO_PUBLIC_SUPABASE_ANON_KEY
Authorization: Bearer EXPO_PUBLIC_SUPABASE_ANON_KEY
```

En caja, después del login, el `Bearer` es el **token del empleado** (no la anon key). Así RLS deja escribir menú y cambiar pedidos.

La app usa `@supabase/supabase-js` (`src/services/supabase.ts`). El panel usa el mismo cliente en `admin-web/app.js`.

### Tablas

| Tabla           | Quién la usa                        | Contenido                                                                                |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `products`      | Alumno (lectura) y caja (CRUD)      | id, categoría, nombre, descripción, precio, `image_url`, `available`, `stock`            |
| `categories`    | Alumno (Home) y caja                | id, nombre, descripción, color, foto, orden                                              |
| `orders`        | Alumno crea/consulta; caja ve todas | id (`ord-0001`), fecha, nombre, nota, estado, total, `device_id`, avisos, `cancelled_at` |
| `order_items`   | Snapshot del pedido                 | producto, cantidad, precio del momento, importe                                          |
| `cafe_settings` | Ambos                               | `is_open` (abierta / cerrada)                                                            |

Estados de un pedido: `recibido` (pendiente) → `en_preparacion` → `listo` → `entregado`, o `cancelado`.

### Endpoints REST (ejemplos)

Leer menú (alumno, sin cuenta):

```http
GET /rest/v1/products?select=*&order=name
GET /rest/v1/products?category=eq.hot-drinks
GET /rest/v1/categories?select=*&order=sort_order
GET /rest/v1/cafe_settings?id=eq.1
```

Pedidos del dispositivo:

```http
GET /rest/v1/orders?device_id=eq.{uuid}&select=*,order_items(*)
GET /rest/v1/orders?id=eq.ord-0001&select=*,order_items(*)
```

Caja (con sesión de empleado):

```http
POST   /rest/v1/products
PATCH  /rest/v1/products?id=eq.hot-latte
DELETE /rest/v1/products?id=eq.hot-latte
PATCH  /rest/v1/orders?id=eq.ord-0001     { "status": "listo" }
PATCH  /rest/v1/cafe_settings?id=eq.1     { "is_open": false }
POST   /storage/v1/object/product-images/...
```

### Funciones SQL (RPC) — reglas de negocio

No se confía en el celular para precios ni límites. El servidor vuelve a validar.

| Función                | Quién  | Qué hace                                                                                                                                                                                                        |
| ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create_cafetec_order` | Alumno | Crea el pedido: cafetería abierta, máximo 3, producto existe y disponible, precio de la base, cooldown 2 h, penalización si canceló hace menos de 2 h. Guarda un **snapshot** (nombre y precio de ese momento). |
| `cancel_cafetec_order` | Alumno | Cancela solo si está `recibido` y el `device_id` coincide. Deja `cancelled_at`.                                                                                                                                 |
| `remove_order_item`    | Caja   | Quita un producto agotado del pedido, recálcula total, avisa al alumno; si era el último, cancela la orden.                                                                                                     |

Ejemplo de crear pedido:

```http
POST /rest/v1/rpc/create_cafetec_order
Content-Type: application/json

{
  "p_customer_name": "Alberto",
  "p_note": "Mesa 4",
  "p_device_id": "uuid-del-celular",
  "p_items": [
    { "productId": "hot-latte", "quantity": 1 }
  ]
}
```

### Seguridad (quién puede qué)

| Acción                       | Anónimo (alumno)                        | Empleado logueado |
| ---------------------------- | --------------------------------------- | ----------------- |
| Ver menú y categorías        | Sí                                      | Sí                |
| Crear / cancelar su pedido   | Sí (RPC)                                | —                 |
| Ver todos los pedidos        | No hace falta; ve los de su `device_id` | Sí                |
| Cambiar estado, stock, fotos | No                                      | Sí                |
| Abrir/cerrar cafetería       | Solo leer                               | Sí                |

La clave `anon` / publishable **puede ir en la app**. La `service_role` no se usa en el celular ni en el panel.

### Tiempo real

Las tablas `orders`, `products`, `categories` y `cafe_settings` están en la publicación Realtime. La app y caja se suscriben: un pedido nuevo o un cambio a **Listo** llega sin recargar.

### Fotos

Bucket público `product-images`. Caja sube el archivo; se guarda la URL en `products.image_url` o `categories.image_url`.

### Cómo encaja con la app

1. Home pide `categories` y `cafe_settings`.
2. Al abrir una categoría pide `products` filtrados.
3. **Hacer pedido** llama `rpc/create_cafetec_order`.
4. **Mis pedidos** lee `orders` por `device_id` y escucha cambios.
5. Caja hace login (`auth`), lista todo y hace `PATCH` de estado o `rpc/remove_order_item`.

### API local (`server/`) — no se usa en la entrega

Al inicio el proyecto tenía `npm run api` (`http://localhost:3000`). Quedó de respaldo. **La entrega corre solo con Supabase.**

---

## Requisitos

- Node.js 18 o superior y npm
- Cuenta de [Expo](https://expo.dev) (para Expo Go)
- Proyecto de [Supabase](https://supabase.com) (ya configurado: `afqycxwuvzmksompycco`)
- App **Expo Go** en el celular (opcional para la demo)

---

## Instalación

```bash
cd CafeTec-2-main
npm install
```

Crea un archivo `.env` en la raíz (copia `.env.example`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://afqycxwuvzmksompycco.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-o-publishable-key
```

La clave está en Supabase → **Project Settings → API Keys** (`anon` / **Publishable**). No uses `service_role`.

Reinicia Expo cada vez que cambies el `.env`.

---

## Base de datos (solo la primera vez)

En Supabase → **SQL Editor**, corre **cada archivo en una query nueva**, en este orden:

| Orden | Archivo                         | Para qué                                    |
| ----- | ------------------------------- | ------------------------------------------- |
| 1     | `supabase/schema.sql`           | Tablas de productos y pedidos               |
| 2     | `supabase/mvp.sql`              | Abierta/cerrada, cancelado, fotos, realtime |
| 3     | `supabase/categories.sql`       | Categorías dinámicas                        |
| 4     | `supabase/order-rules.sql`      | Cancelar pendiente                          |
| 5     | `supabase/remove-item.sql`      | Quitar producto agotado del pedido          |
| 6     | `supabase/stock.sql`            | Inventario por unidades                     |
| 7     | `supabase/enable-cooldowns.sql` | 2 h al pedir y 2 h al cancelar              |

Luego: **Authentication → Users → Add user** y crea el correo/contraseña de caja (ejemplo: `caja@cafetec.com`).

---

## Cómo correrlo (entrega / presentación)

### 1. App del alumno

```bash
npm start
```

- En la terminal: `a` emulador Android, `w` navegador, o escanea el QR con **Expo Go**.
- En **iPhone**, Expo Go y la terminal deben usar la **misma cuenta Expo**.

Para que **otras personas** lo prueben en su celular (otra red):

```bash
npx expo start --tunnel
```

Si pide `@expo/ngrok`, ya está en el proyecto (`npm install`).
Con SDK 57, quien escanea el QR debe iniciar sesión en Expo Go con **la misma cuenta** que la laptop. Si no, usa la versión web (abajo).

Versión **web** (cualquier celular, sin Expo Go):

```bash
npm run web
```

En otra terminal, para compartir el enlace:

```bash
npx --yes cloudflared tunnel --url http://localhost:8081
```

(El puerto puede ser 8081 o el que indique Expo.)

### 2. Panel de caja

En otra terminal:

```bash
cd admin-web
npx --yes serve -p 5500
```

Abre [http://localhost:5500](http://localhost:5500), entra con el usuario de caja.

Si no crea un nuevo database de supabase estan son las credenciales del administrador:

- cafetec@admin.com / @cafetecadmin1314

### 3. Demo sugerida

1. Abre la cafetería (franja verde en el panel).
2. En el celular: categoría → `+` → carrito → **Hacer pedido**.
3. En caja aparece el pedido; pásalo a **En preparación** y **Listo**.
4. El celular recibe el aviso de estado.
5. (Opcional) Corte del día → Excel o PDF; pestaña Tickets → imprimir.

No hace falta `npm run api`. Eso era el servidor local antiguo.

---

## Comandos útiles

```bash
npx tsc --noEmit    # tipos TypeScript
npm run lint        # ESLint
```

---

## Estructura

| Ruta                     | Qué es                                                |
| ------------------------ | ----------------------------------------------------- |
| `src/app/`               | Pantallas: Home, categorías, carrito, pedidos         |
| `src/components/`        | Menú, tabs, banner abierta/cerrada, ticket de estado  |
| `src/context/`           | Carrito, pedidos, cafetería, red                      |
| `src/services/`          | Supabase, productos, pedidos, notificaciones          |
| `src/data/products.json` | Menú de respaldo                                      |
| `admin-web/`             | Panel de caja (HTML + JS + CSS)                       |
| `supabase/`              | Scripts SQL                                           |
| `assets/images/`         | Logo y fotos                                          |
| `server/`                | API local antigua (opcional, no se usa en la entrega) |

### Flujo

1. Alumno: Home → categoría → carrito → **Hacer pedido**.
2. Supabase guarda el pedido (`create_cafetec_order`).
3. Caja lo ve en tiempo real y cambia el estado.
4. El celular avisa: en preparación, listo, entregado o cancelado.

---

## Notas de entrega

- El alumno **no crea cuenta**; se identifica el dispositivo (`deviceId`).
- Límite de **3 productos** por pedido.
- Tras pedir: **2 horas** para volver a pedir en ese celular.
- Si **cancela** (solo en pendiente): **2 horas** de espera.
- Producto agotado: caja puede quitarlo del pedido; el resto sigue y el alumno recibe aviso.
- Archivos `.env` no se suben a git.
