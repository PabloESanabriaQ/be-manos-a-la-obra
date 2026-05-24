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
