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

## API de desarrollo

En otra terminal, inicia el servidor:

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

## Estructura principal

```text
src/app/          Pantallas y rutas de la aplicación
src/components/   Componentes reutilizables
src/context/      Estado global del carrito
src/data/         Catálogo compartido con la API
src/hooks/        Hooks personalizados
src/services/     Comunicación con la API
server/           API de desarrollo
assets/           Imágenes y recursos visuales
```
