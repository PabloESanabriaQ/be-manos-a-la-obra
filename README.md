# Manos a la Obra — API

API REST para gestión de proyectos con jerarquía: **Proyectos → Épicas → Historias → Tareas**.

## Requisitos

- Node.js 18+
- MongoDB (local o Atlas)

## Configuración

Copiá el archivo de ejemplo y completá las variables:

```bash
cp .env.example .env
```

Variables requeridas:

```
MONGO_URI=mongodb://localhost:27017/manos-a-la-obra
JWT_SECRET=un-secreto-seguro
```

Variables opcionales:

```
PORT=3000
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
NODE_ENV=development
```

## Levantar la aplicación

**Desarrollo** (con hot-reload):

```bash
npm install
npm run dev
```

**Producción**:

```bash
npm start
```

El servidor arranca en `http://localhost:3000` (o el `PORT` definido).

## Correr los tests

```bash
npm test
```

Tests en modo watch:

```bash
npm run test:watch
```

La suite corre con [Vitest](https://vitest.dev/) y no requiere conexión a base de datos (todos los modelos están mockeados).

## Documentación de la API

Con el servidor corriendo, la documentación interactiva (Swagger UI) está disponible en:

```
http://localhost:3000/api-docs
```

Desde ahí podés explorar todos los endpoints, ver los schemas de request/response y probar llamadas directamente.

## Seed de datos

El script `scripts/seed.js` limpia la base de datos e inserta datos de prueba (usuarios, proyectos, épicas, historias y tareas).

### Correr el seed localmente contra producción (Render)

**Paso 1 — Obtener el `MONGO_URI` de Render**

1. Entrá a [dashboard.render.com](https://dashboard.render.com)
2. Seleccioná tu servicio
3. Andá a la pestaña **Environment**
4. Copiá el valor de la variable `MONGO_URI`

**Paso 2 — Ejecutar el script**

```bash
MONGO_URI="<el valor que copiaste>" npm run seed
```

**Paso 3 — Verificar que funcionó**

```
✓ Conectado a MongoDB
✓ Colecciones limpiadas
✓ Usuarios creados (4)
✓ Proyectos creados (2)
✓ Épicas creadas (4)
✓ Historias creadas (8)
✓ Tareas creadas (16)
```

> **Atención:** el seed borra todos los datos existentes antes de insertar. No correrlo en producción con datos reales.

### Credenciales generadas

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | `admin_users` |
| `pm` | `pm123` | `admin_projects` |
| `dev1` | `dev1123` | `member` |
| `dev2` | `dev2123` | `member` |

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/login` | Iniciar sesión |
| `POST` | `/api/logout` | Cerrar sesión |
| `POST` | `/api/auth/refresh` | Renovar access token |
| `POST` | `/api/users` | Registrar usuario |
| `GET` | `/api/projects` | Listar proyectos |
| `GET` | `/api/epics` | Listar épicas |
| `GET` | `/api/stories` | Listar historias |
| `GET` | `/api/tasks` | Listar tareas |

Todos los endpoints (excepto login, logout, refresh y registro) requieren autenticación mediante cookie de sesión.
