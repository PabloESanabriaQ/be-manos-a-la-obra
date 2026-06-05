# Manos a la Obra — Documentación integral del proyecto

Documento de revisión completo del sistema **Manos a la Obra**, una aplicación
web de gestión jerárquica de proyectos (Proyectos → Épicas → Historias de
Usuario → Tareas) con sistema de roles, autenticación basada en JWT con
refresh tokens en cookies HTTP-only y panel administrativo.

El sistema está compuesto por dos repositorios independientes:

- **Backend** (`be-manos-a-la-obra/`) — API REST con Node.js, Express y MongoDB.
- **Frontend** (`manos-a-la-obra-1/`) — SPA con React + Vite.

---

## Índice

1. [Visión general](#1-visión-general)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Backend — API REST](#3-backend--api-rest)
   - 3.1 [Stack tecnológico](#31-stack-tecnológico)
   - 3.2 [Estructura del proyecto](#32-estructura-del-proyecto)
   - 3.3 [Modelos de datos](#33-modelos-de-datos)
   - 3.4 [Endpoints de la API](#34-endpoints-de-la-api)
   - 3.5 [Autenticación y autorización](#35-autenticación-y-autorización)
   - 3.6 [Validaciones y manejo de errores](#36-validaciones-y-manejo-de-errores)
   - 3.7 [Capa de servicios (lógica de negocio)](#37-capa-de-servicios-lógica-de-negocio)
   - 3.8 [Logging, seed y configuración](#38-logging-seed-y-configuración)
   - 3.9 [Documentación de la API con Swagger](#39-documentación-de-la-api-con-swagger)
4. [Frontend — SPA en React](#4-frontend--spa-en-react)
   - 4.1 [Stack tecnológico](#41-stack-tecnológico)
   - 4.2 [Estructura del proyecto](#42-estructura-del-proyecto)
   - 4.3 [Routing y navegación](#43-routing-y-navegación)
   - 4.4 [Vistas principales](#44-vistas-principales)
   - 4.5 [Componentes reutilizables](#45-componentes-reutilizables)
   - 4.6 [Estado global y autenticación](#46-estado-global-y-autenticación)
   - 4.7 [Cliente HTTP y servicios](#47-cliente-http-y-servicios)
   - 4.8 [Estilos, tema e internacionalización](#48-estilos-tema-e-internacionalización)
5. [Testing](#5-testing)
6. [Calidad de código y flujo de desarrollo](#6-calidad-de-código-y-flujo-de-desarrollo)
7. [Despliegue y variables de entorno](#7-despliegue-y-variables-de-entorno)
8. [Glosario y decisiones de diseño](#8-glosario-y-decisiones-de-diseño)

---

## 1. Visión general

**Manos a la Obra** es una herramienta de gestión de proyectos ágiles que
modela el trabajo en una jerarquía de cuatro niveles inspirada en
metodologías Scrum:

```
Proyecto
   └─ Épica
        └─ Historia de Usuario
             └─ Tarea
```

Cada nivel tiene CRUD completo y se navega de forma anidada en el frontend.
Las historias soportan estimación con **story points** (escala Fibonacci) para
planning póker, asignación de responsables y filtrado por estado.

El sistema implementa tres roles con permisos diferenciados:

| Rol | Alcance | Capacidades clave |
|-----|---------|------------------|
| `admin_users` | Global | Gestiona usuarios y asigna miembros a proyectos. No participa de la operación diaria sobre proyectos. |
| `admin_projects` | Por proyecto | Control total dentro de los proyectos en los que es miembro (CRUD de épicas, historias, tareas). |
| `member` | Por proyecto | Operación cotidiana sobre historias y tareas. Solo lectura/edición parcial sobre proyecto y épicas. |

---

## 2. Arquitectura del sistema

El sistema sigue una arquitectura **cliente-servidor** desacoplada:

```
┌──────────────────────────┐         ┌──────────────────────────┐
│   Frontend SPA (React)   │  HTTPS  │   Backend API REST       │
│   Vite + React Router    │ ◄─────► │   Express + Mongoose     │
│   localStorage (user)    │ cookies │   JWT + Refresh Tokens   │
└──────────────────────────┘         └────────────┬─────────────┘
                                                  │
                                                  ▼
                                          ┌───────────────┐
                                          │   MongoDB     │
                                          │  (Mongoose)   │
                                          └───────────────┘
```

**Comunicación:**

- El frontend consume la API vía un cliente `fetch` centralizado
  (`src/api/client.js`) que envía `credentials: "include"` para propagar las
  cookies.
- El backend emite dos cookies HTTP-only al loguearse: `token` (access JWT,
  15 min) y `refreshToken` (7 días, validado contra BD).
- Si una request recibe 401, el cliente intenta `POST /auth/refresh`
  automáticamente y reintenta la operación original una sola vez.
- CORS está configurado con `credentials: true` y origen definido por
  `CORS_ORIGIN` (default `http://localhost:5173`).

---

## 3. Backend — API REST

### 3.1 Stack tecnológico

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Runtime | Node.js (ES Modules) | 18+ |
| Framework HTTP | Express | ^4.21.2 |
| ODM | Mongoose | ^8.8.4 |
| Base de datos | MongoDB | — |
| Autenticación | jsonwebtoken | ^9.0.2 |
| Hashing | bcryptjs | ^2.4.3 |
| Cookies | cookie-parser | ^1.4.7 |
| CORS | cors | ^2.8.6 |
| Rate limiting | express-rate-limit | ^8.5.2 |
| Logging | pino + pino-http + pino-pretty | ^10.3.1 / ^11.0.0 / ^13.1.3 |
| Doc. API | swagger-jsdoc + swagger-ui-express | ^6.3.0 / ^5.0.1 |
| Variables env | dotenv | ^16.4.7 |
| Testing | Vitest | ^4.1.7 |
| Linting | ESLint | ^10.4.0 |
| Dev tooling | nodemon | ^3.1.7 |

`package.json` declara `"type": "module"`: todo el proyecto usa `import/export`
nativos sin transpilación.

### 3.2 Estructura del proyecto

```
be-manos-a-la-obra/
├── app.js                     # Bootstrap del servidor Express
├── package.json
├── eslint.config.js
├── vitest.config.js
├── README.md / INTEGRATION.md / TODO.md
├── config/
│   ├── logger.js              # Instancia de pino
│   └── swagger.js             # Definición OpenAPI 3.0
├── db/
│   └── mongoDbConnection.js   # Conexión a MongoDB
├── models/                    # Esquemas Mongoose
│   ├── users.model.js
│   ├── projects.model.js
│   ├── epics.model.js
│   ├── stories.model.js
│   ├── tasks.model.js
│   └── refreshToken.model.js
├── controllers/               # Adaptan req/res a servicios
├── services/                  # Lógica de negocio
├── routes/                    # Definición de endpoints + Swagger JSDoc
├── middlewares/
│   ├── authentication.js
│   ├── requireRole.js
│   ├── requireProjectAccess.js
│   ├── resolveProjectId.js
│   └── errorHandler.js
├── errors/                    # Clases custom (NotFound, Validation, ...)
├── utils/                     # Validadores por recurso
├── scripts/seed.js            # Poblado reproducible de BD
└── tests/                     # Tests unitarios de servicios
```

**Separación de capas (request → response):**

1. **Routes** declaran el endpoint y enlazan middlewares.
2. **Middlewares** autentican, autorizan y resuelven contexto.
3. **Controllers** parsean `req`, llaman al servicio y serializan la respuesta.
4. **Services** validan reglas de negocio y acceden a los modelos.
5. **Models** representan el esquema Mongoose.
6. **errorHandler** centraliza la serialización de errores.

### 3.3 Modelos de datos

#### User (`models/users.model.js`)

```js
{
  email: String (required),
  username: String (required, único),
  password: String (required),        // hash bcrypt (10 rounds)
  name: { first: String, last: String },
  role: 'admin_users' | 'admin_projects' | 'member',  // default 'member'
  active: Boolean (default true)      // soft delete (desactivación)
}
```

Las consultas de lectura aplican `.select('-password')` para no exponer el hash.

#### Project (`models/projects.model.js`)

```js
{
  name: String (required),
  description: String,
  icon: String,
  members: [{
    user: ObjectId (ref 'user', required),
    role: 'admin_projects' | 'member'   // rol *dentro del proyecto*
  }],
  deletedAt: Date | null               // soft delete
}
```

> El rol del usuario en un proyecto puede diferir de su rol global. La
> autorización por recurso usa el rol del array `members`, no el rol global.

#### Epic (`models/epics.model.js`)

```js
{
  project: ObjectId (ref 'project', required),
  name: String (required),
  description: String,
  icon: String,
  deletedAt: Date | null
}
```

Reglas de servicio: una vez creada, **no se puede mover una épica a otro
proyecto** (`epics.service.js:44-46`).

#### Story (`models/stories.model.js`)

```js
{
  name: String (required),
  description: String,
  epic: ObjectId (ref 'epic', required),
  owner: ObjectId (ref 'user'),
  assignedTo: [ObjectId (ref 'user')],
  points: Number ∈ {0,1,2,3,5,8,13,21},   // Fibonacci (planning póker)
  status: 'todo' | 'running' | 'done',     // default 'todo'
  created / due / started / finished: Date,
  icon: String,
  deletedAt: Date | null
}
```

Validaciones de negocio:

- Los usuarios en `assignedTo` deben ser miembros del proyecto padre
  (validado vía `validateAssignedTo` en `stories.service.js:40-52`).
- No se puede mover una historia a otra épica.

#### Task (`models/tasks.model.js`)

```js
{
  name: String (required),
  story: ObjectId (ref 'story', required),
  description: String,
  status: 'todo' | 'running' | 'done' (default 'todo'),
  done: Boolean (default false),
  created: Date,
  dueDate: Date,
  deletedAt: Date | null
}
```

No se puede mover una tarea a otra historia.

#### RefreshToken (`models/refreshToken.model.js`)

```js
{
  token: String (required, único),    // 64 bytes hex aleatorios
  user: ObjectId (ref 'user', required),
  expiresAt: Date (required),         // +7 días
  createdAt: Date (default now)
}
```

Estrategia de rotación: cada `refresh` elimina el token usado y emite uno
nuevo. El `logout` también lo elimina. Se recomienda un índice TTL en
`expiresAt` para limpiar tokens vencidos automáticamente.

#### Soft delete en cascada

Borrar un proyecto marca `deletedAt = now` en proyecto, épicas, historias y
tareas asociadas (implementado manualmente en `projects.service.js:remove`).
La misma lógica encadenada se aplica a épicas (→ historias → tareas) e
historias (→ tareas).

### 3.4 Endpoints de la API

URL base: `/api`. Salvo indicación contraria, todos los endpoints requieren
sesión válida (cookie `token`).

#### Autenticación (`/api/login`, `/api/logout`, `/api/auth/refresh`)

| Método | Ruta | Body | Notas |
|--------|------|------|-------|
| POST | `/api/login` | `{ username, password }` | Rate limit 10 intentos / 15 min. Setea cookies. |
| POST | `/api/auth/refresh` | — (lee cookie `refreshToken`) | Rotación: elimina el viejo, emite uno nuevo. |
| POST | `/api/logout` | — | Elimina el refresh token en BD y limpia cookies. |

#### Usuarios (`/api/users`)

| Método | Ruta | Autorización |
|--------|------|--------------|
| POST | `/api/users` | `admin_users` |
| GET | `/api/users?page=&limit=` | `admin_users` |
| GET | `/api/users/me` | autenticado |
| GET | `/api/users/:_id` | `admin_users` |
| PATCH | `/api/users/me/password` | autenticado (valida contraseña actual) |
| PATCH | `/api/users/:_id` | `admin_users` |
| PATCH | `/api/users/:_id/deactivate` | `admin_users` |

#### Proyectos (`/api/projects`)

| Método | Ruta | Autorización |
|--------|------|--------------|
| GET | `/api/projects` | autenticado (filtra por membresía si no es `admin_users`) |
| POST | `/api/projects` | `admin_users` (body requiere `adminId`) |
| GET | `/api/projects/:_id` | `project:read` |
| PUT / PATCH | `/api/projects/:_id` | `project:edit` |
| DELETE | `/api/projects/:_id` | `project:delete` |
| GET | `/api/projects/:_id/epics` | `epic:read` |
| PUT | `/api/projects/:_id/members` | `admin_users` |

> El POST de proyectos requiere `{ name, adminId }`. El `adminId` es el usuario que
> queda inicializado como `admin_projects` dentro del proyecto. Se valida que exista
> y esté activo; cualquier `members` que venga en el body se ignora (la gestión
> posterior pasa por `PUT /:_id/members`). Documentado en el schema
> `ProjectCreateInput` de Swagger.

#### Épicas (`/api/epics`)

| Método | Ruta | Autorización |
|--------|------|--------------|
| GET | `/api/epics` | autenticado (filtra proyectos del usuario) |
| POST | `/api/epics` | `epic:create` |
| GET | `/api/epics/:_id` | `epic:read` |
| PUT | `/api/epics/:_id` | `epic:edit` |
| DELETE | `/api/epics/:_id` | `epic:delete` |
| GET | `/api/epics/:_id/stories` | `story:read` |

#### Historias (`/api/stories`)

| Método | Ruta | Autorización |
|--------|------|--------------|
| GET | `/api/stories?assignedTo=&status=` | autenticado |
| POST | `/api/stories` | `story:create` |
| GET | `/api/stories/:_id` | `story:read` |
| PUT | `/api/stories/:_id` | `story:edit` |
| DELETE | `/api/stories/:_id` | `story:delete` |
| GET | `/api/stories/:_id/tasks` | `task:read` |

Los filtros `assignedTo` y `status` permiten al frontend resolver tanto la
vista del miembro (sus historias) como la del PM (filtrado por estado).

#### Tareas (`/api/tasks`)

| Método | Ruta | Autorización |
|--------|------|--------------|
| GET | `/api/tasks` | autenticado |
| POST | `/api/tasks` | `task:create` |
| GET | `/api/tasks/:_id` | `task:read` |
| PUT / PATCH | `/api/tasks/:_id` | `task:edit` |
| DELETE | `/api/tasks/:_id` | `task:delete` |

#### Convenciones de respuesta

- Éxito en listados: `{ data: [...], pagination: { page, limit, total } }`.
- Éxito en operaciones simples: `{ message: '...' }` o el recurso devuelto.
- Error: `{ error: true, name, message }` con status HTTP correspondiente.
  Cuando aplica, el body suma `code` (handle estable, ej. `INVALID_POINTS`) y
  `params` (objeto con valores para interpolación). Esto permite al frontend
  traducir el mensaje según el idioma del usuario.
- Paginación default: `page=1`, `limit=20` (máximo 100).

### 3.5 Autenticación y autorización

#### Flujo de tokens

```
POST /api/login (username, password)
        │
        ▼
  bcrypt.compare(password, user.password)
        │
        ▼
  ¿user.active === true?
        │
        ▼
  Set-Cookie: token (JWT, 15min, HttpOnly)
  Set-Cookie: refreshToken (random hex, 7d, HttpOnly)
```

- **Access token (`token`)**: JWT firmado con `JWT_SECRET`, payload `{ id }`,
  expira a los 15 minutos.
- **Refresh token**: 64 bytes aleatorios persistidos en la colección
  `refreshtokens`. Al rotar (`/api/auth/refresh`), el token usado se elimina
  y se emite uno nuevo. Esto invalida sesiones robadas.
- **Cookies**: ambas son `HttpOnly`. En producción (`NODE_ENV=production`)
  son `Secure` y `SameSite=none`; en desarrollo, `SameSite=strict`.

#### Middleware `authMiddleware` (`middlewares/authentication.js`)

Por cada request:

1. Lee `req.cookies.token`. Si no existe → **401**.
2. Verifica el JWT con `JWT_SECRET`. Si es inválido o expiró → **401**.
3. Carga el usuario desde BD. Si no existe → **401**.
4. Si `user.active === false` → **403** (cuenta desactivada).
5. Inyecta `req.userId` y `req.userRole` para downstream.

#### Autorización en dos niveles

**Rol global** (`requireRole(...roles)`): se usa para acciones cross-project
como gestionar usuarios o crear proyectos:

```js
router.post('/', authMiddleware, requireRole('admin_users'), createProject);
```

**Permisos dentro del proyecto** (`requireProjectAccess(resource, action)`):
matriz hard-coded en `middlewares/requireProjectAccess.js`:

| Acción | `admin_projects` | `member` |
|--------|------------------|----------|
| `project:read/edit/delete` | ✅ todos | ✅ solo read |
| `epic:create/edit/delete` | ✅ todos | ✅ solo read + edit |
| `story:*` | ✅ todos | ✅ todos |
| `task:*` | ✅ todos | ✅ todos |

El middleware resuelve el `projectId` y verifica que el `userId` esté en
`members`, y que su rol dentro del proyecto incluya el permiso pedido.

**`resolveProjectId(resourceType)`**: para rutas anidadas (épica, historia,
tarea), navega la jerarquía para obtener el `projectId` del recurso padre.
Por ejemplo, una `PATCH /api/tasks/:_id` resuelve `task → story → epic →
project` antes de aplicar el chequeo de permisos.

#### Rate limiting

`/api/login` aplica `express-rate-limit`: máximo 10 intentos por IP cada
15 minutos (`routes/login.routes.js:7-13`). Pasado el umbral, responde con
`{ error: true, message: 'Demasiados intentos...' }`.

### 3.6 Validaciones y manejo de errores

#### Clases de error custom (`errors/`)

| Clase | Status | Caso de uso |
|-------|--------|-------------|
| `NotFoundError` | 404 | Recurso inexistente |
| `ValidationError` | 400 | Body inválido o regla de negocio violada |
| `InvalidCredentialsError` | 400 | Login fallido |
| `ForbiddenError` | 403 | Permiso insuficiente / usuario desactivado |
| `UsernameAlreadyExistsError` | 400 | Username ya registrado |

Cada clase asigna `this.status` y `this.name` para que `errorHandler` los
serialice uniformemente.

#### Middleware `errorHandler` (`middlewares/errorHandler.js`)

```js
errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) logger.error({ err }, err.message);
  else               logger.warn ({ err }, err.message);

  const body = { error: true, name: err.name, message: err.message };
  if (err.code)   body.code = err.code;
  if (err.params) body.params = err.params;
  res.status(status).json(body);
};
```

Registrado al final de la cadena en `app.js`.

#### Códigos de error para i18n del cliente

`ValidationError` acepta un segundo argumento opcional `{ code, params }` que
el `errorHandler` propaga al body de la respuesta. Esto deja al backend
generar un mensaje por default en inglés y al frontend traducirlo según el
idioma del usuario.

```js
throw new ValidationError(
  `Points must be one of: ${VALID_POINTS.join(', ')}`,
  { code: 'INVALID_POINTS', params: { allowed: VALID_POINTS.join(', ') } },
);
```

El frontend mapea `code` a una clave `errors.<CODE>` en su archivo de
locales e interpola los `params`. El fallback es el `message` original.

#### Validadores por recurso (`utils/`)

Validan body en `create*` y `update*`. Por ejemplo,
`utils/validateStories.js` exige `name`, `epic`, y opcionalmente verifica que
`points` sea Fibonacci y que `status` sea uno de los enums.

### 3.7 Capa de servicios (lógica de negocio)

Los servicios encapsulan la lógica de negocio y son los **únicos consumidores
directos** de los modelos. Esto permite tests unitarios sin levantar la base
de datos (los modelos se mockean con `vi.mock`).

Funciones representativas:

- `projects.service.remove(id)`: marca `deletedAt` en proyecto, épicas,
  historias y tareas asociadas (cascada manual).
- `stories.service.validateAssignedTo(assignedTo, epicId)`: traversal
  `epic → project` para verificar que los usuarios estén en `members`.
- `auth.service.refresh(token)`: implementa **rotación de tokens**:
  encuentra → valida vigencia → elimina → emite nuevos.
- `users.service.updatePassword(id, currentPassword, newPassword)`: exige
  contraseña actual válida antes de hashear y persistir la nueva.

### 3.8 Logging, seed y configuración

#### Logging con Pino (`config/logger.js`)

```js
pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
  })
});
```

- **Desarrollo**: salida coloreada y legible vía `pino-pretty`.
- **Producción**: JSON estructurado.
- `pino-http` registra automáticamente cada request HTTP.

#### Bootstrap (`app.js`)

1. Carga `.env` con `dotenv`.
2. Verifica variables requeridas (`MONGO_URI`, `JWT_SECRET`) y aborta el
   proceso si faltan (fail-fast).
3. Configura CORS (`origin: CORS_ORIGIN`, `credentials: true`), cookies y
   parsing JSON.
4. Conecta a MongoDB.
5. Monta `/api-docs` (Swagger UI) y los routers `/api/*`.
6. Registra `errorHandler` al final.
7. Escucha en `PORT` (default `3000`).

#### Script de seed (`scripts/seed.js`)

Ejecutable con `npm run seed`. Limpia las colecciones y carga datos
reproducibles:

- **4 usuarios** (uno por rol y dos miembros):
  - `admin` / `admin123` (`admin_users`)
  - `pm` / `pm123` (`admin_projects`)
  - `dev1` / `dev1123` (`member`)
  - `dev2` / `dev2123` (`member`)
- **2 proyectos** (Alpha, Beta) con miembros distintos.
- **4 épicas** distribuidas entre ambos.
- **12 historias** con story points Fibonacci, estados mixtos y asignaciones.
- **24 tareas** (2 por historia: "Diseño UI" + "Implementación").

### 3.9 Documentación de la API con Swagger

`config/swagger.js` arma la spec OpenAPI 3.0 que `swagger-jsdoc` enriquece
leyendo los comentarios JSDoc de cada archivo en `routes/`. Está expuesta en
`http://localhost:3000/api-docs`.

**Schemas definidos**: `Pagination`, `Error`, `Project`, `ProjectInput`,
`Epic`, `EpicInput`, `Story`, `StoryInput`, `Task`, `TaskInput`, `User`.

**Security scheme**: `cookieAuth` (`apiKey` en cookie `token`). Para probar
endpoints autenticados desde Swagger UI, hay que loguearse primero contra
`/api/login` desde el mismo navegador para que el browser envíe la cookie.

**Parámetros reutilizables**: `idParam`, `pageParam`, `limitParam`.

---

## 4. Frontend — SPA en React

### 4.1 Stack tecnológico

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| UI | React + React DOM | 18.3.1 |
| Build | Vite | 5.4.1 |
| Router | React Router DOM | 6.26.2 |
| i18n | react-i18next + i18next | 17.0.8 / 26.2.0 |
| Estilos | Sass + SCSS Modules | 1.79.3 |
| Validación props | prop-types | 15.8.1 |
| Testing | Vitest + React Testing Library | 4.1.7 / 16.3.2 |
| Lint/format | ESLint 9 (flat config) + Prettier 3 | 9.9.0 / 3.8.3 |
| Git hooks | Husky + lint-staged | 9.1.7 / 17.0.5 |
| Deploy | Vercel | — |

Requiere Node.js ≥ 20.10.0. Se gestiona estado global con **Context API**
nativo (sin Redux/Zustand).

### 4.2 Estructura del proyecto

```
src/
├── App.jsx                     # UserProvider + Navigation + RouterProvider
├── main.jsx                    # createRoot, imports globales
├── theme.js                    # Detección inicial de tema del sistema
├── i18n.js                     # Configuración i18next (es/en)
├── api/client.js               # apiFetch() centralizado, refresh automático
├── Router/index.jsx            # Definición de rutas
├── context/UserContext.jsx     # user, role, canDo(), homeRoute()
├── hooks/useTheme.js
├── components/                 # Componentes reutilizables
│   ├── AdminUsersPanel/
│   ├── ProtectedRoute/
│   ├── Navigation/
│   ├── ListContainerComponent/, ListComponent/, ListItemComponent/
│   ├── PaginationComponent/, LoadingSpinner/
│   ├── ErrorToast/, SuccessToast/
│   ├── TitleComponent/, EmptyListComponent/
│   └── ...
├── views/                      # Páginas/pantallas
│   ├── LoginView/, LogoutView/
│   ├── HomeView/, MyProjectsView/, MyStoriesView/
│   ├── ProjectView/, EpicView/, UserStoryView/, TaskView/
│   ├── ProfileView/, SettingsView/, ErrorView/
├── services/                   # Hooks GET + funciones de mutación
├── locales/{es,en}.json
├── styles/theme.scss
└── test/setup.js
```

### 4.3 Routing y navegación

`Router/index.jsx` declara las rutas con `createBrowserRouter`. Las rutas
operativas se envuelven en `<ProtectedRoute allowedRoles=[...]>`:

| Ruta | Vista | Roles |
|------|-------|-------|
| `/` y `/home` | HomeView | cualquiera |
| `/login` | LoginView | no autenticado |
| `/settings` | SettingsView | autenticado |
| `/profile` | ProfileView | autenticado |
| `/my-projects` | MyProjectsView | `admin_projects`, `member` |
| `/my-stories` | MyStoriesView | `admin_projects`, `member` |
| `/project/:idProyecto` | ProjectView | `admin_projects`, `member` |
| `/epic/:idEpica` | EpicView | `admin_projects`, `member` |
| `/userStory/:idHistoriaDeUsuario` | UserStoryView | `admin_projects`, `member` |
| `/task/:Tarea` | TaskView | `admin_projects`, `member` |

`ProtectedRoute` valida que el rol esté en `allowedRoles`; si no, redirige
a la ruta home obtenida por `homeRoute()` del context.

### 4.4 Vistas principales

#### LoginView
Formulario `username` + `password`. Llama a `login()`, persiste el usuario en
`localStorage` y en el context, navega a `/home`. Muestra `ErrorToast` ante
errores.

#### HomeView
- Si `admin_users`: renderiza `AdminUsersPanel` (tabs Usuarios/Proyectos).
- Resto: lista paginada de 6 proyectos ordenados por `updatedAt` desc.

#### MyProjectsView
Lista plana de los proyectos del usuario, usando `ListContainerComponent`.

#### MyStoriesView (vista dual)
- `admin_projects` (PM): pega una sola vez a `/stories` al montar y filtra por
  status (todos / todo / running / done) **en memoria con `useMemo`**. Cambiar
  de pestaña no dispara un refetch.
- `member`: filtro server-side por `assignedTo === userId`.

#### ProjectView
- Cabecera con nombre/descripción del proyecto + acciones (edit si
  `canDo("project:edit")`).
- Form de edición (proyecto y épica) ocultos por defecto, expandibles.
- `ListContainerComponent` de épicas con `onEdit/onDelete` condicionales.
- Form de creación de épica si `canDo("epic:create")`.

#### EpicView
Análoga a `ProjectView` pero un nivel abajo: épica → historias.

#### UserStoryView
- Cabecera con nombre, descripción, story points y asignados.
- Edición de la historia: nombre, descripción, points, status, assignedTo.
- **Asignación de miembros**: solo `admin_projects`. Dropdown que lista los
  miembros del proyecto disponibles + tags removibles de los ya asignados.
- CRUD de tareas asociadas.

#### TaskView
Detalle de la tarea con edición de nombre/descripción, checkbox `done` y
acción de eliminar.

#### ProfileView
Avatar con iniciales, datos del usuario y, si no es `admin_users`, la lista
de proyectos a los que pertenece con el rol que tiene en cada uno.

#### SettingsView
- Toggle de idioma (es/en) persistido en `localStorage.language`.
- Toggle de tema (light/dark) vía `useTheme` (modifica `data-theme` en `<html>`).
- Formulario de cambio de contraseña (actual / nueva / confirmar) que llama
  a `PATCH /users/me/password`. Feedback con `SuccessToast`/`ErrorToast`.

#### AdminUsersPanel (renderizado dentro de HomeView)
- **Tab Usuarios**: crear, editar y desactivar usuarios; tabla con username,
  email, rol y estado.
- **Tab Proyectos**: **crear proyectos** asignando un `admin_projects` desde un
  dropdown de usuarios activos; luego seleccionar un proyecto existente para
  ver miembros, agregar/quitar y cambiar su rol dentro del proyecto.

### 4.5 Componentes reutilizables

| Componente | Responsabilidad |
|------------|-----------------|
| `ListContainerComponent` | Título + (lista o `EmptyListComponent`). Propaga `onEdit/onDelete`. |
| `ListComponent` | Renderiza `<ul>` con `ListItemComponent` por cada item. |
| `ListItemComponent` | `Link` al detalle + acciones de edit/delete visibles al hover. |
| `PaginationComponent` | Botones ← / →, "página / total". |
| `LoadingSpinner` | Spinner con texto i18n; `role="status"` para accesibilidad. |
| `ErrorToast` / `SuccessToast` | Notificación auto-dismiss a 4 s + botón cerrar. |
| `Navigation` | Hamburger menu adaptado al rol; cierra con `Escape`. |
| `ProtectedRoute` | Redirige si el rol del usuario no está autorizado. |
| `TitleComponent`, `EmptyListComponent` | Helpers visuales. |

### 4.6 Estado global y autenticación

`UserContext` (`src/context/UserContext.jsx`) expone:

- `user`: objeto del usuario activo o `null`. Se rehidrata de `localStorage`
  al iniciar la app.
- `setUser(user)` para persistir login/logout.
- `canDo(permission)`: consulta una matriz de permisos por rol idéntica en
  espíritu a la del backend.
- Helpers: `isAdminUsers()`, `isAdminProjects()`, `isMember()`, `homeRoute()`.

**Persistencia**:
- `localStorage.user` (JSON) → sesión.
- `localStorage.language` → idioma.
- `localStorage.theme` → tema.

**Importante**: el JWT vive en cookies HTTP-only manejadas por el backend.
El frontend no lo lee jamás; solo se basa en la presencia del objeto `user`
en `localStorage` para asumir sesión activa.

### 4.7 Cliente HTTP y servicios

#### `apiFetch(endpoint, options, isRetry)` (`src/api/client.js`)

- Prefija `VITE_API_URL`.
- Fuerza `credentials: "include"` para enviar cookies.
- Setea `Content-Type: application/json`.
- En **401**: intenta `POST /auth/refresh`. Si tiene éxito, reintenta la
  request original (con `isRetry=true` para evitar bucles). Si falla,
  remueve `user` de `localStorage` y redirige a `/`.
- Parsea JSON y propaga un `Error(data.message)` ante respuestas no-ok. Si la
  respuesta incluye `code` y/o `params`, los adjunta al `Error` para que el
  caller pueda traducirlos con `src/api/translateError.js` (helper que busca
  `errors.<code>` en i18n e interpola `params`, con fallback al `message`).

#### Convención de servicios

- **GET** se expone como **custom hook** que devuelve
  `{ data, loading, error }`:

  ```js
  export default function useAllProjects() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => { /* apiFetch('/projects') */ }, []);
    return { data, loading, error };
  }
  ```

- **Mutaciones** son funciones `async` puras que devuelven `data` y lanzan
  excepciones para que la vista las capture con `try/catch`.

Servicios implementados (resumen): `useAllProjects` (expone `refetch` para
recargar el listado tras crear), `useAllStories`, `useAllTasks`,
`useEpicById`, `useEpicsByProjectId`, `useMe`, `useProjectById`,
`useTaskById`, `useTasksByUSId`, `useUSById`, `useUSByEpicId`, `getUsers`,
`login`, `logout`, `changePassword`, `createUser`, `updateUser`,
`deactivateUser`, `createProject`, `createEpic`, `updateEpic`, `deleteEpic`,
`createStory`, `updateStory`, `deleteStory`, `createTask`, `updateTask`,
`deleteTask`, `updateProject`, `updateProjectMembers`.

### 4.8 Estilos, tema e internacionalización

#### SCSS Modules + CSS custom properties

Cada componente tiene su `styles.module.scss` co-localizado. La paleta vive
en `src/styles/theme.scss` como variables CSS (`--color-bg`, `--color-brand`,
`--color-text`, etc.) y se intercambia entre temas mediante el atributo
`data-theme` en `<html>`.

- **Light** (default): fondo `#f0f8ff`, brand `#385752`, accent `#f9bc60`.
- **Dark** (`data-theme="dark"`): fondo `#0d1e1c`, brand `#7bbdb4`, texto
  claro, `color-scheme: dark` para que los controles nativos se adapten.

`useTheme` hace toggle del atributo y persiste la elección.

#### Internacionalización

`react-i18next` con dos idiomas: español (default) e inglés. Las claves se
agrupan por dominio (`nav.*`, `crud.*`, `admin.*`, etc.) en
`src/locales/{es,en}.json`. La regla en el proyecto: **no hardcodear strings
visibles**; siempre `t("clave")`.

**Errores del backend traducidos en el cliente**. El namespace `errors.*` mapea
los `code` que emite el backend a mensajes localizados con interpolación de
`params`. Por ejemplo, `errors.INVALID_POINTS` = "Los puntos deben ser uno de:
{{allowed}}". El helper `translateError(t, err)` lo encapsula y cae al
`message` original si no encuentra clave. Agregar un nuevo error traducible
implica: 1) lanzarlo en el backend con `{ code, params }`; 2) sumar la clave
`errors.<CODE>` en `locales/es.json` y `locales/en.json`.

---

## 5. Testing

### Backend (Vitest)

- Configuración: `vitest.config.js` con `globals: true, environment: 'node'`.
- Tests por servicio en `tests/*.service.test.js` (6 archivos).
- Estrategia: **mockear los modelos Mongoose** con `vi.mock(...)` para
  poder ejercitar la lógica de negocio sin BD real.

Ejemplo (auth):

```js
vi.mock('../models/users.model.js', () => {
  const MockUser = vi.fn(function () { return { save: vi.fn() }; });
  MockUser.findOne = vi.fn();
  MockUser.findById = vi.fn();
  return { default: MockUser };
});

it('crea el usuario y devuelve access + refresh token', async () => {
  User.findOne.mockResolvedValue(null);
  User.mockImplementation(() => ({ save: vi.fn().mockResolvedValue({ _id: 'x' }) }));
  const result = await register('pablo', 'pwd', 'pablo@test.com');
  expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
  expect(result).toMatchObject({ accessToken: expect.any(String) });
});
```

Comandos: `npm test`, `npm run test:watch`.

> Cobertura: solo capa de servicios. No hay tests de integración HTTP ni de
> middlewares — es una limitación conocida (documentada en `TODO.md`).

### Frontend (Vitest + React Testing Library)

- Setup en `src/test/setup.js`: mocks de `react-i18next` (devuelve la key),
  `localStorage` y `window.matchMedia` para que el código de tema no
  reviente bajo jsdom.
- Tests co-localizados con los archivos. Cubren servicios, hooks,
  `PaginationComponent` y `LoginView`.
- Pendiente (según `TODO.md`): tests para `AdminUsersPanel` y
  `ProtectedRoute`.

Comandos: `npm test` (watch), `npm run test:run` (single shot).

---

## 6. Calidad de código y flujo de desarrollo

### Linting y formato

**Backend**: ESLint 10 con `eslint.config.js`, globals de Node, ECMAScript
moderno.

**Frontend**: ESLint 9 (flat config) con plugins de React, hooks y
react-refresh; Prettier 3 integrado vía `eslint-config-prettier`. Reglas
clave de Prettier: `semi`, comillas dobles, `tabWidth: 2`, `printWidth: 100`.

### Git hooks

`husky` + `lint-staged` (frontend) ejecutan en pre-commit:

```
*.{js,jsx}        → eslint --fix + prettier --write
*.{css,scss,json,md} → prettier --write
```

### Convenciones acordadas en el equipo (frontend)

- Componentes funcionales con `export default` desde `ComponentName/index.jsx`.
- SCSS Modules co-localizados (`styles.module.scss`).
- Servicios GET como hooks `{ data, loading, error }`; mutaciones como
  funciones `async`.
- `prop-types` obligatorio en todos los componentes.
- i18n obligatorio para strings visibles.

---

## 7. Despliegue y variables de entorno

### Backend (`.env`)

| Variable | Obligatoria | Default | Descripción |
|----------|-------------|---------|-------------|
| `MONGO_URI` | ✅ | — | Connection string de MongoDB |
| `JWT_SECRET` | ✅ | — | Firma de los JWT |
| `PORT` | — | `3000` | Puerto HTTP |
| `CORS_ORIGIN` | — | `http://localhost:5173` | Origen permitido por CORS |
| `NODE_ENV` | — | — | `production` activa cookies `Secure`/`SameSite=none` |
| `LOG_LEVEL` | — | `info` | Nivel de pino |

Si falta alguna variable obligatoria, el proceso aborta al arrancar.

### Frontend (`.env`)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base de la API (ej. `http://localhost:3000/api`) |

### Comandos

**Backend**:
- `npm install`
- `npm run dev` — desarrollo con nodemon + pino-pretty
- `npm start` — producción
- `npm test` / `npm run test:watch`
- `npm run seed` — poblar BD (opcional `MONGO_URI="..." npm run seed`)

**Frontend**:
- `npm install`
- `npm run dev` — Vite dev server
- `npm run build` — build estático en `dist/`
- `npm run preview` — preview del build
- `npm test` / `npm run test:run`
- `npm run lint`, `npm run format`, `npm run format:check`

### Despliegue del frontend en Vercel

`vercel.json`:
- `framework: vite`, `outputDirectory: dist`
- Rewrite SPA: `/(.*)` → `/index.html` para soportar `BrowserRouter`.

---

## 8. Glosario y decisiones de diseño

### Glosario

- **Story point**: estimación de complejidad relativa en Fibonacci
  (0,1,2,3,5,8,13,21). Se asigna a la historia de usuario y sirve para
  planning póker.
- **Soft delete**: marcar `deletedAt` en lugar de borrar el documento.
  Permite recuperabilidad y mantener integridad referencial histórica.
- **Refresh token rotativo**: cada uso emite uno nuevo e invalida el viejo,
  acotando la ventana de un token robado.
- **Cookies HTTP-only**: cookies inaccesibles desde JavaScript del navegador
  (mitiga XSS contra el token).

### Decisiones de diseño relevantes

1. **Permisos en dos niveles** (rol global + rol en proyecto). Esto separa
   la administración del sistema (`admin_users`) de la operación interna de
   un proyecto.
2. **Cookies HTTP-only para JWT**. El frontend nunca toca el token: lo
   maneja el navegador. La sesión "lógica" se infiere de `localStorage.user`.
3. **Soft delete en cascada implementado en servicios** (no en middleware de
   Mongoose) para mantener control explícito sobre el orden y poder testear
   sin la BD.
4. **Servicios GET como hooks**. Estandariza la firma
   `{ data, loading, error }` y elimina lógica repetida en las vistas.
5. **Validadores centralizados en `utils/`** en lugar de Joi/Zod. Mantiene
   las dependencias livianas a costa de algo de boilerplate.
6. **Sin ORM ni librería de auth**. Mongoose + bcryptjs + jsonwebtoken
   directamente, lo que favorece la transparencia pedagógica.
7. **i18n y tema oscuro de primera clase** desde el inicio, no añadidos
   tardíamente.

### Limitaciones conocidas (de `TODO.md`)

- Sin tests de integración HTTP en el backend.
- Sin tests para `AdminUsersPanel` ni `ProtectedRoute` en el frontend.
- La i18n de errores del backend se resuelve en el cliente vía `code`/`params`;
  por ahora solo está cubierto `INVALID_POINTS`. Sumar nuevos códigos a medida
  que se identifiquen mensajes que el usuario final llega a ver.
