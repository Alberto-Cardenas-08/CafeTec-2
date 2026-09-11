# CafeTec · Panel de Administración Web

Panel web independiente para administrar productos y consultar pedidos del API de CafeTec.

## Ejecutar

1. En la raíz del proyecto, inicia el API:

```bash
npm run api
```

2. En otra terminal:

```bash
cd admin-web
python3 -m http.server 5500 --bind 0.0.0.0
```

3. Abre `http://localhost:5500`.

El panel usa por defecto `http://localhost:3000`. También puedes cambiar la URL desde el cuadro API del panel.

**Nota:** este agregado no modifica los archivos de la aplicación móvil. Los productos creados/editados se mantienen mientras el servidor API esté ejecutándose, porque el servidor actual maneja el catálogo en memoria.
