import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/users.model.js';
import Project from '../models/projects.model.js';
import Epic from '../models/epics.model.js';
import Story from '../models/stories.model.js';
import Task from '../models/tasks.model.js';
import RefreshToken from '../models/refreshToken.model.js';

const hash = (pwd) => bcrypt.hash(pwd, 10);

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Conectado a MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Epic.deleteMany({}),
    Story.deleteMany({}),
    Task.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);
  console.log('✓ Colecciones limpiadas');

  const [, pm, dev1, dev2] = await User.insertMany([
    {
      username: 'admin',
      email: 'admin@test.com',
      password: await hash('admin123'),
      role: 'admin_users',
      name: { first: 'Ada', last: 'Admin' },
    },
    {
      username: 'pm',
      email: 'pm@test.com',
      password: await hash('pm123'),
      role: 'admin_projects',
      name: { first: 'Walter', last: 'Molina' },
    },
    {
      username: 'dev1',
      email: 'dev1@test.com',
      password: await hash('dev1123'),
      role: 'member',
      name: { first: 'Dev', last: 'Uno' },
    },
    {
      username: 'dev2',
      email: 'dev2@test.com',
      password: await hash('dev2123'),
      role: 'member',
      name: { first: 'Dev', last: 'Dos' },
    },
  ]);
  console.log('✓ Usuarios creados (4)');

  const [project1, project2] = await Project.insertMany([
    {
      name: 'Proyecto Alpha',
      description: 'Sistema de gestión de inventario',
      members: [
        { user: pm._id, role: 'admin_projects' },
        { user: dev1._id, role: 'member' },
      ],
    },
    {
      name: 'Proyecto Beta',
      description: 'Plataforma de e-commerce',
      members: [
        { user: pm._id, role: 'admin_projects' },
        { user: dev2._id, role: 'member' },
      ],
    },
  ]);
  console.log('✓ Proyectos creados (2)');

  const [epic1, epic2, epic3, epic4] = await Epic.insertMany([
    { name: 'Autenticación', description: 'Login, registro y permisos', project: project1._id },
    { name: 'Catálogo de productos', description: 'CRUD de productos', project: project1._id },
    { name: 'Carrito de compras', description: 'Flujo de compra', project: project2._id },
    { name: 'Pasarela de pagos', description: 'Integración con pagos', project: project2._id },
  ]);
  console.log('✓ Épicas creadas (4)');

  // Proyecto Alpha: miembros pm y dev1
  // Proyecto Beta:  miembros pm y dev2
  const stories = await Story.insertMany([
    // epic1 — Autenticación (Alpha)
    {
      name: 'Registro de usuario',
      description: 'Formulario de registro con validación de email y contraseña',
      epic: epic1._id,
      assignedTo: [dev1._id],
      points: 5,
      status: 'done',
      started: new Date('2026-01-10'),
      finished: new Date('2026-01-15'),
    },
    {
      name: 'Login con email y contraseña',
      description: 'Autenticación JWT con refresh token',
      epic: epic1._id,
      assignedTo: [dev1._id],
      points: 3,
      status: 'done',
      started: new Date('2026-01-16'),
      finished: new Date('2026-01-19'),
    },
    {
      name: 'Recuperación de contraseña',
      description: 'Envío de email con enlace temporal para resetear contraseña',
      epic: epic1._id,
      assignedTo: [dev1._id, pm._id],
      points: 5,
      status: 'running',
      started: new Date('2026-01-20'),
    },

    // epic2 — Catálogo de productos (Alpha)
    {
      name: 'Listar productos',
      description: 'Endpoint paginado con filtros por categoría y precio',
      epic: epic2._id,
      assignedTo: [dev1._id],
      points: 3,
      status: 'running',
      started: new Date('2026-01-22'),
    },
    {
      name: 'Agregar producto',
      description: 'CRUD completo de productos con carga de imágenes',
      epic: epic2._id,
      assignedTo: [],
      points: 8,
      status: 'todo',
    },
    {
      name: 'Editar y eliminar producto',
      description: 'Actualización parcial y borrado lógico',
      epic: epic2._id,
      assignedTo: [],
      points: 5,
      status: 'todo',
    },

    // epic3 — Carrito de compras (Beta)
    {
      name: 'Agregar ítem al carrito',
      description: 'Agregar productos al carrito con control de stock',
      epic: epic3._id,
      assignedTo: [dev2._id],
      points: 3,
      status: 'done',
      started: new Date('2026-01-12'),
      finished: new Date('2026-01-16'),
    },
    {
      name: 'Ver resumen del carrito',
      description: 'Vista con ítems, cantidades, subtotales y total',
      epic: epic3._id,
      assignedTo: [dev2._id],
      points: 2,
      status: 'done',
      started: new Date('2026-01-17'),
      finished: new Date('2026-01-18'),
    },
    {
      name: 'Eliminar ítem del carrito',
      description: 'Quitar productos o reducir cantidad',
      epic: epic3._id,
      assignedTo: [dev2._id, pm._id],
      points: 2,
      status: 'running',
      started: new Date('2026-01-21'),
    },

    // epic4 — Pasarela de pagos (Beta)
    {
      name: 'Pago con tarjeta',
      description: 'Integración con Stripe para cobros con tarjeta de crédito/débito',
      epic: epic4._id,
      assignedTo: [dev2._id],
      points: 13,
      status: 'running',
      started: new Date('2026-01-23'),
    },
    {
      name: 'Confirmación de pago',
      description: 'Webhook de Stripe y email de confirmación al comprador',
      epic: epic4._id,
      assignedTo: [],
      points: 8,
      status: 'todo',
    },
    {
      name: 'Historial de transacciones',
      description: 'Listado de pagos con estado y monto para el usuario',
      epic: epic4._id,
      assignedTo: [],
      points: 5,
      status: 'todo',
    },
  ]);
  console.log('✓ Historias creadas (12)');

  const tasks = stories.flatMap((story) => [
    { name: `Diseño UI — ${story.name}`, story: story._id },
    { name: `Implementación — ${story.name}`, story: story._id },
  ]);
  await Task.insertMany(tasks);
  console.log('✓ Tareas creadas (24)');

  await mongoose.disconnect();

  console.log(`
=== Seed completado ===

Credenciales:
  admin / admin123   → admin_users    (gestiona usuarios y asignaciones)
  pm    / pm123      → admin_projects → Proyecto Alpha, Proyecto Beta
  dev1  / dev1123    → member         → Proyecto Alpha
  dev2  / dev2123    → member         → Proyecto Beta

Historias por estado:
  done    → Registro de usuario, Login, Agregar ítem al carrito, Ver resumen del carrito
  running → Recuperación de contraseña, Listar productos, Eliminar ítem del carrito, Pago con tarjeta
  todo    → Agregar producto, Editar/eliminar producto, Confirmación de pago, Historial de transacciones
`);
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
