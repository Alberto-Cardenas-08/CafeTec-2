# CafeTec

Aplicación móvil de cafetería creada con Expo, React Native, TypeScript y Expo Router.

## Funcionalidades

- Menú de bebidas calientes, bebidas frías, frappes y lunch.
- Productos cargados desde una API de desarrollo, con menú local de respaldo.
- Carrito persistente con cantidades, total y límite de 3 productos.
- Pedido a caja: nombre, nota opcional y envío a la API.
- Zona de **Mis pedidos** para consultar el estado (recibido, en preparación, listo, entregado).
- Notificación al agregar productos al carrito.
- Navegación inferior entre Home, Carrito y Pedidos.

## Requisitos

- Node.js
- npm
- Expo CLI mediante `npx`
- Android Studio para ejecutar un emulador Android (opcional)

## Instalación

```bash
npm install
```

## Ejecutar la aplicación

Inicia Expo con:

```bash
npm start
```

También puedes usar los comandos específicos:

```bash
npm run android
npm run ios
npm run web
```

## API (Supabase)

CafeTec usa el proyecto [Supabase afqycxwuvzmksompycco](https://supabase.com/dashboard/project/afqycxwuvzmksompycco).

1. Abre **SQL Editor** → New query.
2. Pega y corre el archivo `supabase/schema.sql`.
3. En **Project Settings → API** copia la **anon public** key.
4. Crea `.env` en la raíz:

```env
EXPO_PUBLIC_SUPABASE_URL=https://afqycxwuvzmksompycco.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

5. Reinicia Expo (`npm start`).

El panel de caja (`admin-web/`) usa la misma URL. Pega ahí la anon key y pulsa **Conectar**.

## API local (opcional)

Si no hay anon key, la app puede usar el servidor local:

```bash
npm run api
```

La API estará disponible en `http://localhost:3000`.

Endpoints principales:

```text
GET    /health
GET    /api/products?category=hot-drinks
GET    /api/products?category=cold-drinks
GET    /api/products?category=frappes
GET    /api/products?category=lunch
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/orders
GET    /api/orders?ids=ord-0001,ord-0002
GET    /api/orders/:id
POST   /api/orders
```

La API utiliza memoria durante el desarrollo; los cambios se pierden al reiniciar el servidor.

## Configuración en un dispositivo físico

Copia `.env.example` como `.env` y cambia la dirección por la IP local de tu computadora:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

El dispositivo y la computadora deben estar conectados a la misma red.

## Calidad del código

Comprobar los tipos de TypeScript:

```bash
npx tsc --noEmit
```

Ejecutar ESLint:

```bash
npm run lint
```

## Estructura del proyecto

CafeTec son 3 partes: app del alumno, panel de caja (web) y Supabase (API en la nube).

```text
Alumno (celular)  ──►  Supabase  ◄──  Caja (navegador)
                         │
                    menú + pedidos
```

`node_modules/` son librerías descargadas (no se edita). `dist/` es un build generado.

### Raíz (configuración)

| Archivo | Qué hace |
|---|---|
| `package.json` | Dependencias y comandos: `npm start`, `npm run api` |
| `package-lock.json` | Versiones exactas de esas librerías |
| `app.json` | Nombre de la app, icono, splash, Android/iOS |
| `eas.json` | Cómo se publica en Expo (EAS) |
| `tsconfig.json` | TypeScript: rutas `@/` → `src/` |
| `eslint.config.js` | Reglas de estilo / errores |
| `expo-env.d.ts` | Tipos automáticos de Expo |
| `.env` | URL y clave de Supabase (no se sube a git) |
| `.env.example` | Plantilla del `.env` |
| `README.md` | Cómo instalar y correr el proyecto |
| `LICENSE` | Licencia |
| `AGENTS.md` / `CLAUDE.md` | Notas para IAs (Expo v57) |

### App del alumno (`src/app`)

Expo Router: un archivo = una pantalla.

| Archivo | Pantalla |
|---|---|
| `src/app/_layout.tsx` | Envoltorio: tema, carrito, pedidos, splash |
| `src/app/index.tsx` | Home: 4 categorías |
| `src/app/bebidas-calientes.tsx` | Menú calientes |
| `src/app/bebidas-frias.tsx` | Menú frías |
| `src/app/frappes.tsx` | Frappes |
| `src/app/lunch.tsx` | Lunch |
| `src/app/carrito.tsx` | Carrito y **Hacer pedido** |
| `src/app/pedidos.tsx` | Lista “mis pedidos” |
| `src/app/pedido.tsx` | Estado de un pedido (`ord-0001`) |
| `src/app/explore.tsx` | Sobra de la plantilla Expo (oculta) |

### Piezas de la UI (`src/components`)

| Archivo | Qué hace |
|---|---|
| `src/components/category-screen.tsx` | Lista de productos + botón `+` (las 4 categorías la usan) |
| `src/components/app-tabs.tsx` | Tabs: Home, Carrito, Pedidos |
| `src/components/app-tabs.web.tsx` | Lo mismo, versión navegador |
| `src/components/order-status-track.tsx` | Barra Recibido → Entregado |
| `src/components/animated-icon.tsx` | Splash al abrir |
| `src/components/themed-text.tsx` | Texto con estilo |
| `src/components/themed-view.tsx` | Cajas con estilo |
| `external-link.tsx`, `hint-row.tsx`, `web-badge.tsx`, `ui/collapsible.tsx` | Restos de la plantilla Expo |

### Estado y datos

| Archivo | Qué hace |
|---|---|
| `src/context/cart-context.tsx` | Carrito (máx. 3), se guarda en el teléfono |
| `src/context/orders-context.tsx` | IDs de *tus* pedidos en el teléfono |
| `src/data/products.json` | Menú de respaldo si no hay internet |
| `src/hooks/use-menu-products.ts` | Carga el menú de Supabase (o el JSON) |
| `src/hooks/use-theme.ts` / `use-color-scheme.ts` | Claro/oscuro |
| `src/constants/theme.ts` | Colores de la plantilla |
| `src/global.css` | CSS para web |

### Conexión a internet (`src/services`)

| Archivo | Qué hace |
|---|---|
| `src/services/supabase.ts` | Cliente del proyecto Supabase |
| `src/services/products.ts` | Lee el menú (Supabase o API local) + fotos locales |
| `src/services/orders.ts` | Crear y consultar pedidos |
| `src/services/api.ts` | URL vieja `localhost:3000` (respaldo) |

### Supabase (API real)

| Archivo | Qué hace |
|---|---|
| `supabase/schema.sql` | Tablas `products`, `orders`, `order_items` y la función `create_cafetec_order` |

La app habla con `https://afqycxwuvzmksompycco.supabase.co/rest/v1/`.

### Panel de caja (`admin-web/`)

Página solo para personal, no para alumnos.

| Archivo | Qué hace |
|---|---|
| `admin-web/index.html` | Estructura: Resumen, Productos, Pedidos |
| `admin-web/app.js` | Conecta a Supabase, CRUD del menú, cambia estados |
| `admin-web/styles.css` | Diseño del panel |
| `admin-web/README.md` | Cómo abrirlo |

### API local (`server/`) — opcional

| Archivo | Qué hace |
|---|---|
| `server/index.js` | Servidor Node en la PC (`npm run api`) |
| `server/orders.json` | Pedidos cuando se usaba solo la PC |

### Otros

| Carpeta / archivo | Qué hace |
|---|---|
| `assets/images/` | Logo, fotos de productos, iconos |
| `postman/` | Pruebas de la API local (Postman) |
| `scripts/reset-project.js` | Script de la plantilla Expo |

### Flujo

1. El alumno abre **Home** → categoría → `+` → **Carrito**.
2. **Hacer pedido** llama a Supabase (`create_cafetec_order`).
3. El teléfono guarda el `ord-0001` y en **Pedidos** consulta el estado.
4. Caja, en `admin-web`, ve todos y lo pasa a *en preparación* / *listo*.

