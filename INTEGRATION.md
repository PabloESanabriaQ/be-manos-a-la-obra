# Consideraciones de integración

## MongoDB

### Nombres de colecciones

Mongoose pluraliza los nombres de modelos automáticamente. Los modelos definidos y sus colecciones resultantes son:

| Modelo (`mongoose.model`) | Colección en MongoDB |
|---------------------------|----------------------|
| `project` | `projects` |
| `epic` | `epics` |
| `story` | `stories` |
| `task` | `tasks` |
| `user` | `users` |
| `refreshToken` | `refreshtokens` |

### Referencias y populate

Todas las relaciones usan `Schema.Types.ObjectId` con `ref`. Mongoose **no popula automáticamente** los documentos referenciados: si el frontend necesita datos anidados (ej. la épica dentro de una story), hay que agregar `.populate('epic')` en el servicio correspondiente. Actualmente la API devuelve solo el ID de la referencia.

### Soft delete

Los modelos Project, Epic, Story y Task tienen un campo `deletedAt: Date | null`. Un documento con `deletedAt !== null` se considera eliminado. **Ningún documento se borra físicamente** a través de la API.

Puntos críticos:
- Toda consulta directa a MongoDB (scripts de migración, Compass, Atlas Data Explorer) debe filtrar `{ deletedAt: null }` para ver solo registros activos.
- El borrado en cascada (proyecto → épicas → stories → tasks) lo maneja la capa de servicios. Si se manipulan documentos directamente en la BD, la integridad referencial no está garantizada.

### Índices recomendados

La aplicación no crea índices explícitos (salvo `token: unique` en `refreshtokens`). Para producción conviene agregar:

```js
// Filtros frecuentes por soft delete + parent
db.epics.createIndex({ project: 1, deletedAt: 1 });
db.stories.createIndex({ epic: 1, deletedAt: 1 });
db.tasks.createIndex({ story: 1, deletedAt: 1 });

// Paginación sobre listas completas
db.projects.createIndex({ deletedAt: 1 });

// TTL para limpiar refresh tokens expirados automáticamente
db.refreshtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### Limpieza de refresh tokens

Los refresh tokens expirados no se eliminan automáticamente por la API (solo se eliminan al usarlos o al hacer logout). El índice TTL de arriba delega esa limpieza a MongoDB. Sin él, la colección crece indefinidamente.

### Variable de entorno

La conexión usa `MONGO_URI`. El nombre anterior (`DB_CONNECTION`) ya no está en uso.

---

## Frontend

### CORS y cookies

La API usa cookies `HttpOnly` para autenticación. Para que el browser las envíe en cada request es **obligatorio** incluir credenciales:

```js
// fetch nativo
fetch('http://localhost:3000/api/projects', { credentials: 'include' });

// axios
axios.defaults.withCredentials = true;
// o por instancia:
const api = axios.create({ baseURL: 'http://localhost:3000/api', withCredentials: true });
```

Sin `credentials: 'include'` / `withCredentials: true`, el browser no envía las cookies y todos los endpoints protegidos devuelven 401.

### Flujo de autenticación

```
POST /api/login         → setea cookies `token` (15min) y `refreshToken` (7 días)
  ↓ cualquier request autenticado
  ↓ si responde 401
POST /api/auth/refresh  → rota ambas cookies, devuelve nuevos tokens
  ↓ reintentar request original
  ↓ si /refresh también falla (token expirado o inválido)
POST /api/login         → pedir credenciales al usuario
```

Implementar un interceptor de axios o equivalente que maneje esto automáticamente:

```js
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      await api.post('/auth/refresh');
      return api(err.config);
    }
    return Promise.reject(err);
  }
);
```

### Estructura de respuestas

**Listas paginadas** (`GET /api/projects`, `/api/epics`, etc.):
```json
{
  "data": [ { "_id": "...", "name": "..." } ],
  "pagination": { "page": 1, "limit": 20, "total": 42 }
}
```

Parámetros de paginación: `?page=2&limit=10` (defaults: page 1, limit 20).

**Recurso singular**:
```json
{ "data": { "_id": "...", "name": "..." } }
```

**Errores**:
```json
{ "error": true, "name": "NotFoundError", "message": "Task not found" }
```

Códigos de estado usados: `200`, `201`, `400` (validación / credenciales), `401` (no autenticado), `404` (no encontrado), `429` (rate limit en login), `500` (error interno).

### Jerarquía de recursos

Al crear recursos, respetar el orden de dependencias:

```
Usuario → Proyecto → Épica → Historia → Tarea
```

- Una épica requiere un `project` existente.
- Una historia requiere una `epic` existente.
- Una tarea requiere una `story` existente.
- La épica y la historia de un recurso **no se pueden cambiar** una vez creado (la API lo rechaza con 400).

### Swagger UI

Durante el desarrollo, `http://localhost:3000/api-docs` permite explorar todos los endpoints con sus schemas. Las cookies se envían automáticamente si el browser ya tiene sesión iniciada.
