# Migración de MongoDB a PostgreSQL

Este documento describe los pasos necesarios para migrar la persistencia del proyecto desde MongoDB (con Mongoose) a una base relacional, tomando PostgreSQL como ejemplo concreto.

## 1. Estado actual

La app utiliza:

- **MongoDB** como motor, conectado vía `db/mongoDbConnection.js` con la variable `MONGO_URI`.
- **Mongoose** como ODM, con 6 modelos en `models/`:
  - `users` (con sub-documento `name: { first, last }`)
  - `projects` (con array embebido `members: [{ user, role }]`)
  - `epics` (referencia a `project`)
  - `stories` (referencias a `epic`, `owner`, y array `assignedTo`)
  - `tasks` (referencia a `story`)
  - `refreshTokens` (referencia a `user`)
- Borrado lógico (`deletedAt`) en projects, epics, stories y tasks.
- IDs auto generados como `ObjectId`.

El cambio a un motor relacional requiere replantear: estructura de tablas (sin documentos anidados ni arrays), la capa de acceso a datos (cambiar el ORM/driver), las consultas con `populate`, y el seed.

---

## 2. Decisiones a tomar antes de migrar

| Decisión | Opciones | Recomendación |
|---|---|---|
| Motor relacional | PostgreSQL, MySQL/MariaDB, SQLite | **PostgreSQL** (mejor soporte de enums, JSON, índices parciales). |
| Capa de acceso | Sequelize, Prisma, TypeORM, Knex + SQL crudo | **Sequelize** si se quiere mínima fricción viniendo de Mongoose (modelos en JS, API similar). **Prisma** si se prioriza tipado y migraciones declarativas. |
| Tipo de PK | `SERIAL`/`BIGSERIAL` (int) o `UUID` | **UUID** para mantener la idea de IDs opacos como ObjectId; usar `gen_random_uuid()` (extensión `pgcrypto`). |
| Migraciones | `sequelize-cli`, `umzug`, `prisma migrate`, `node-pg-migrate` | El CLI nativo del ORM elegido. |

> En el resto del documento se asume **PostgreSQL + Sequelize + UUIDs**.

---

## 3. Mapeo de esquemas Mongo → Postgres

### 3.1 Tablas resultantes

```
users              (id, email, username, password, first_name, last_name, role, active)
projects           (id, name, description, icon, deleted_at)
project_members    (project_id, user_id, role)                    ← reemplaza array embebido
epics              (id, project_id, name, description, icon, deleted_at)
stories            (id, epic_id, owner_id, name, description, points,
                    created, due, started, finished, status, icon, deleted_at)
story_assignees    (story_id, user_id)                            ← reemplaza array de refs
tasks              (id, story_id, name, description, status, created, due_date,
                    done, deleted_at)
refresh_tokens     (id, user_id, token UNIQUE, expires_at, created_at)
```

### 3.2 Decisiones de modelado

- **Sub-documento `name: { first, last }`** → dos columnas `first_name`, `last_name`. Si en el futuro creciera, podría moverse a tabla aparte.
- **Array embebido `project.members`** → tabla N:M `project_members` con columna extra `role` (ya no es un join puro, sino una "tabla de asociación con atributos").
- **Array de refs `story.assignedTo`** → tabla N:M `story_assignees`.
- **Enums** (`role`, `status`, `points`) → tipo `ENUM` de Postgres, o `VARCHAR` + `CHECK`. Para `points` (valores 0,1,2,3,5,8,13,21) un `SMALLINT` con `CHECK` es lo más limpio.
- **Borrado lógico**: `deleted_at TIMESTAMPTZ NULL`. Un índice parcial `WHERE deleted_at IS NULL` acelera los listados activos.
- **Integridad referencial**: todas las FKs explícitas. Conviene definir `ON DELETE` según política (por ejemplo `RESTRICT` salvo `story_assignees` y `project_members` que pueden ir `CASCADE`).

### 3.3 DDL de referencia

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role        AS ENUM ('admin_users', 'admin_projects', 'member');
CREATE TYPE project_role     AS ENUM ('admin_projects', 'member');
CREATE TYPE work_item_status AS ENUM ('todo', 'running', 'done');

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL UNIQUE,
  username   VARCHAR(64)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  first_name VARCHAR(80)  NOT NULL,
  last_name  VARCHAR(80)  NOT NULL,
  role       user_role    NOT NULL DEFAULT 'member',
  active     BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  icon        VARCHAR(255),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX projects_active_idx ON projects (id) WHERE deleted_at IS NULL;

CREATE TABLE project_members (
  project_id UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID         NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       project_role NOT NULL,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE epics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  icon        VARCHAR(255),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX epics_project_idx ON epics (project_id) WHERE deleted_at IS NULL;

CREATE TABLE stories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epic_id     UUID NOT NULL REFERENCES epics(id) ON DELETE RESTRICT,
  owner_id    UUID REFERENCES users(id)          ON DELETE SET NULL,
  name        VARCHAR(160) NOT NULL,
  description TEXT,
  points      SMALLINT NOT NULL DEFAULT 0 CHECK (points IN (0,1,2,3,5,8,13,21)),
  created     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due         TIMESTAMPTZ,
  started     TIMESTAMPTZ,
  finished    TIMESTAMPTZ,
  status      work_item_status NOT NULL DEFAULT 'todo',
  icon        VARCHAR(255),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX stories_epic_idx   ON stories (epic_id) WHERE deleted_at IS NULL;
CREATE INDEX stories_status_idx ON stories (status)  WHERE deleted_at IS NULL;

CREATE TABLE story_assignees (
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  PRIMARY KEY (story_id, user_id)
);

CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id    UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  name        VARCHAR(160) NOT NULL,
  description TEXT,
  status      work_item_status NOT NULL DEFAULT 'todo',
  created     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date    TIMESTAMPTZ,
  done        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(512) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. Cambios de infraestructura

### 4.1 Dependencias

```bash
npm uninstall mongoose
npm install pg sequelize
npm install --save-dev sequelize-cli
```

### 4.2 Variables de entorno

Reemplazar `MONGO_URI` por:

```
DATABASE_URL=postgres://user:password@localhost:5432/manos_a_la_obra
```

### 4.3 Conexión

Reemplazar `db/mongoDbConnection.js` por `db/sequelize.js`:

```js
import { Sequelize } from 'sequelize';
import 'dotenv/config';
import logger from '../config/logger.js';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
});

export const connect = () =>
  sequelize
    .authenticate()
    .then(() => logger.info('Conexión a PostgreSQL exitosa'))
    .catch((err) => {
      logger.error({ err }, 'Error al conectar con PostgreSQL');
      process.exit(1);
    });

export default sequelize;
```

Y actualizar el bootstrap en `app.js` para llamar a `connect()` en lugar de `mongoDbConnection()`.

### 4.4 Migraciones

A diferencia de Mongo, en Postgres el esquema es explícito. Con `sequelize-cli`:

```bash
npx sequelize-cli init
npx sequelize-cli migration:generate --name create-initial-schema
```

Las migraciones reemplazan a la creación implícita de colecciones. Toda evolución del modelo a partir de acá pasa por una nueva migración versionada (no se modifican migraciones ya aplicadas en producción).

---

## 5. Cambios en modelos

Ejemplo de migración del modelo `users`:

```js
// models/users.model.js
import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const User = sequelize.define('user', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email:     { type: DataTypes.STRING, allowNull: false, unique: true },
  username:  { type: DataTypes.STRING, allowNull: false, unique: true },
  password:  { type: DataTypes.STRING, allowNull: false },
  firstName: { type: DataTypes.STRING, allowNull: false, field: 'first_name' },
  lastName:  { type: DataTypes.STRING, allowNull: false, field: 'last_name'  },
  role:      { type: DataTypes.ENUM('admin_users', 'admin_projects', 'member'), defaultValue: 'member' },
  active:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'users', timestamps: false });

export default User;
```

Y las asociaciones (en un archivo `models/index.js` o equivalente):

```js
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'projectId', as: 'members' });
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'userId',    as: 'projects' });

Project.hasMany(Epic,  { foreignKey: 'projectId' });
Epic.belongsTo(Project,{ foreignKey: 'projectId' });

Epic.hasMany(Story,    { foreignKey: 'epicId' });
Story.belongsTo(Epic,  { foreignKey: 'epicId' });

Story.belongsToMany(User, { through: StoryAssignee, foreignKey: 'storyId', as: 'assignedTo' });
Story.belongsTo(User,     { foreignKey: 'ownerId',   as: 'owner' });

Story.hasMany(Task,    { foreignKey: 'storyId' });
Task.belongsTo(Story,  { foreignKey: 'storyId' });
```

---

## 6. Cambios en servicios

El patrón se mantiene, pero la API cambia:

| Mongoose | Sequelize |
|---|---|
| `Model.find(filter)` | `Model.findAll({ where: filter })` |
| `Model.findById(id)` | `Model.findByPk(id)` |
| `Model.findByIdAndUpdate(id, body, { new: true })` | `instance.update(body)` o `Model.update(body, { where: { id } })` |
| `Model.countDocuments(filter)` | `Model.count({ where: filter })` |
| `.populate('epic')` | `include: [{ model: Epic }]` |
| `{ $in: ids }` | `{ [Op.in]: ids }` |
| `Model.insertMany([...])` | `Model.bulkCreate([...])` |

Ejemplo: la consulta de `stories.service.js` que arma el filtro por proyectos del usuario pasa de dos `find` con `$in` a un `include` con joins:

```js
const stories = await Story.findAll({
  where: { deletedAt: null, ...(status && { status }) },
  include: [
    {
      model: Epic,
      required: true,
      where: { deletedAt: null },
      include: [{
        model: Project,
        required: true,
        include: [{ model: User, as: 'members', where: { id: userId }, required: true }],
      }],
    },
    ...(assignedTo ? [{ model: User, as: 'assignedTo', where: { id: assignedTo }, required: true }] : []),
  ],
  offset: (page - 1) * limit,
  limit,
});
```

Puntos finos a no olvidar:

- Los borrados lógicos siguen siendo manuales (`deletedAt = new Date()`). Alternativa: activar `paranoid: true` en los modelos para que Sequelize lo gestione automáticamente.
- Las operaciones que cambian varias tablas (por ejemplo crear historia con asignados, o borrar historia y sus tasks) deben envolverse en una **transacción**: `sequelize.transaction(async (t) => { ... })`. En Mongo se hacía con dos `update` sueltos; en relacional conviene atomicidad real.
- `ObjectId` se comparaba con `.toString()`; con UUIDs basta comparar strings.

---

## 7. Adaptación del seed

El seed actual (`scripts/seed.js`) hace:

1. Conecta a Mongo.
2. Borra todas las colecciones con `deleteMany({})`.
3. `insertMany` de usuarios, proyectos, épicas, historias, tareas.
4. Usa los `_id` recién creados para enlazar.

En Postgres el flujo cambia en tres puntos:

- **Limpieza**: usar `TRUNCATE ... RESTART IDENTITY CASCADE` (más rápido y resetea secuencias si las hubiera).
- **IDs**: ya no se asignan por hand-off de `_id`; se usan los `id` que Sequelize devuelve tras `bulkCreate` (los UUID se generan en la DB o en la app).
- **Asociaciones N:M**: los miembros de proyecto y los `assignedTo` ya no son arrays embebidos; se insertan en las tablas de unión.
- **Transacción**: todo el seed dentro de un `transaction` para que falle atómicamente si algo se rompe.

### 7.1 `scripts/seed.js` para PostgreSQL

```js
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import sequelize from '../db/sequelize.js';
import {
  User, Project, ProjectMember, Epic, Story, StoryAssignee, Task, RefreshToken,
} from '../models/index.js';

const hash = (pwd) => bcrypt.hash(pwd, 10);

async function seed() {
  await sequelize.authenticate();
  console.log('✓ Conectado a PostgreSQL');

  await sequelize.transaction(async (t) => {
    // 1. Limpieza — el CASCADE arrastra las tablas dependientes
    await sequelize.query(
      `TRUNCATE TABLE
         refresh_tokens, tasks, story_assignees, stories,
         epics, project_members, projects, users
       RESTART IDENTITY CASCADE`,
      { transaction: t },
    );
    console.log('✓ Tablas limpiadas');

    // 2. Usuarios
    const [admin, pm, dev1, dev2] = await User.bulkCreate([
      { username: 'admin', email: 'admin@test.com', password: await hash('admin123'),
        role: 'admin_users',    firstName: 'Ada',    lastName: 'Admin' },
      { username: 'pm',    email: 'pm@test.com',    password: await hash('pm123'),
        role: 'admin_projects', firstName: 'Walter', lastName: 'Molina' },
      { username: 'dev1',  email: 'dev1@test.com',  password: await hash('dev1123'),
        role: 'member',         firstName: 'Dev',    lastName: 'Uno' },
      { username: 'dev2',  email: 'dev2@test.com',  password: await hash('dev2123'),
        role: 'member',         firstName: 'Dev',    lastName: 'Dos' },
    ], { transaction: t, returning: true });
    console.log('✓ Usuarios creados (4)');

    // 3. Proyectos
    const [project1, project2] = await Project.bulkCreate([
      { name: 'Proyecto Alpha', description: 'Sistema de gestión de inventario' },
      { name: 'Proyecto Beta',  description: 'Plataforma de e-commerce' },
    ], { transaction: t, returning: true });

    // 4. Tabla de unión: project_members
    await ProjectMember.bulkCreate([
      { projectId: project1.id, userId: pm.id,   role: 'admin_projects' },
      { projectId: project1.id, userId: dev1.id, role: 'member' },
      { projectId: project2.id, userId: pm.id,   role: 'admin_projects' },
      { projectId: project2.id, userId: dev2.id, role: 'member' },
    ], { transaction: t });
    console.log('✓ Proyectos creados (2) y miembros asignados');

    // 5. Épicas
    const [epic1, epic2, epic3, epic4] = await Epic.bulkCreate([
      { name: 'Autenticación',         description: 'Login, registro y permisos', projectId: project1.id },
      { name: 'Catálogo de productos', description: 'CRUD de productos',          projectId: project1.id },
      { name: 'Carrito de compras',    description: 'Flujo de compra',            projectId: project2.id },
      { name: 'Pasarela de pagos',     description: 'Integración con pagos',      projectId: project2.id },
    ], { transaction: t, returning: true });
    console.log('✓ Épicas creadas (4)');

    // 6. Historias — sin assignedTo, va aparte
    const storiesData = [
      { epicId: epic1.id, name: 'Registro de usuario',          points: 5, status: 'done',
        started: '2026-01-10', finished: '2026-01-15', assignees: [dev1.id] },
      { epicId: epic1.id, name: 'Login con email y contraseña', points: 3, status: 'done',
        started: '2026-01-16', finished: '2026-01-19', assignees: [dev1.id] },
      { epicId: epic1.id, name: 'Recuperación de contraseña',   points: 5, status: 'running',
        started: '2026-01-20', assignees: [dev1.id, pm.id] },
      { epicId: epic2.id, name: 'Listar productos',             points: 3, status: 'running',
        started: '2026-01-22', assignees: [dev1.id] },
      { epicId: epic2.id, name: 'Agregar producto',             points: 8, status: 'todo', assignees: [] },
      { epicId: epic2.id, name: 'Editar y eliminar producto',   points: 5, status: 'todo', assignees: [] },
      { epicId: epic3.id, name: 'Agregar ítem al carrito',      points: 3, status: 'done',
        started: '2026-01-12', finished: '2026-01-16', assignees: [dev2.id] },
      { epicId: epic3.id, name: 'Ver resumen del carrito',      points: 2, status: 'done',
        started: '2026-01-17', finished: '2026-01-18', assignees: [dev2.id] },
      { epicId: epic3.id, name: 'Eliminar ítem del carrito',    points: 2, status: 'running',
        started: '2026-01-21', assignees: [dev2.id, pm.id] },
      { epicId: epic4.id, name: 'Pago con tarjeta',             points: 13, status: 'running',
        started: '2026-01-23', assignees: [dev2.id] },
      { epicId: epic4.id, name: 'Confirmación de pago',         points: 8, status: 'todo', assignees: [] },
      { epicId: epic4.id, name: 'Historial de transacciones',   points: 5, status: 'todo', assignees: [] },
    ];

    const stories = await Story.bulkCreate(
      storiesData.map(({ assignees, ...s }) => s),
      { transaction: t, returning: true },
    );
    console.log('✓ Historias creadas (12)');

    // 7. story_assignees
    const assignees = stories.flatMap((story, i) =>
      storiesData[i].assignees.map((userId) => ({ storyId: story.id, userId })),
    );
    if (assignees.length) await StoryAssignee.bulkCreate(assignees, { transaction: t });

    // 8. Tasks
    const tasks = stories.flatMap((story) => [
      { name: `Diseño UI — ${story.name}`,       storyId: story.id },
      { name: `Implementación — ${story.name}`,  storyId: story.id },
    ]);
    await Task.bulkCreate(tasks, { transaction: t });
    console.log('✓ Tareas creadas (24)');
  });

  await sequelize.close();
  console.log('=== Seed completado ===');
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
```

### 7.2 Diferencias clave respecto al seed actual

| Tema | MongoDB | PostgreSQL |
|---|---|---|
| Limpieza | `Model.deleteMany({})` por colección | un único `TRUNCATE ... CASCADE` |
| Atomicidad | inserts sueltos | todo dentro de `sequelize.transaction` |
| `name: { first, last }` | sub-documento | dos columnas `firstName` / `lastName` |
| `project.members` | array embebido en el insert | inserts separados en `project_members` |
| `story.assignedTo` | array de ObjectIds en el insert | inserts separados en `story_assignees` |
| IDs | `_id` de Mongo | `id` UUID; usar `returning: true` para recuperarlos |
| Orden de borrado | irrelevante | importa por FKs (de hijas a padres, o usar `CASCADE`) |

---

## 8. Plan de migración paso a paso

1. **Levantar Postgres local** (Docker es lo más rápido) y crear la base.
2. **Agregar dependencias** (`pg`, `sequelize`, `sequelize-cli`) y quitar `mongoose`.
3. **Crear `db/sequelize.js`** y migrar `app.js` para usar la nueva conexión.
4. **Escribir las migraciones iniciales** que generen el esquema descrito en §3.
5. **Reescribir los modelos** uno a uno (`users` → `projects` → `project_members` → `epics` → `stories` → `story_assignees` → `tasks` → `refresh_tokens`).
6. **Reescribir los services** reemplazando la API de Mongoose por la de Sequelize, prestando especial atención a:
   - los filtros con `$in` → `Op.in`
   - los `populate` → `include`
   - los flujos multi-modelo → `transaction`
7. **Reescribir el seed** según §7.
8. **Adaptar los tests** (los mocks de Mongoose deben reemplazarse; conviene tests con base real en SQLite en memoria o un Postgres de test).
9. **Actualizar `DOCUMENTACION.md`** y el `.env.example` con la nueva variable `DATABASE_URL`.

Una vez verde toda la suite de tests y validado el seed, recién entonces se elimina el código de Mongo.
