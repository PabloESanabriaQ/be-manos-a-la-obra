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

  const stories = await Story.insertMany([
    { name: 'Registro de usuario', epic: epic1._id },
    { name: 'Login con email y contraseña', epic: epic1._id },
    { name: 'Listar productos', epic: epic2._id },
    { name: 'Agregar producto', epic: epic2._id },
    { name: 'Agregar ítem al carrito', epic: epic3._id },
    { name: 'Ver resumen del carrito', epic: epic3._id },
    { name: 'Pago con tarjeta', epic: epic4._id },
    { name: 'Confirmación de pago', epic: epic4._id },
  ]);
  console.log('✓ Historias creadas (8)');

  const tasks = stories.flatMap((story) => [
    { name: `Diseño UI — ${story.name}`, story: story._id },
    { name: `Implementación — ${story.name}`, story: story._id },
  ]);
  await Task.insertMany(tasks);
  console.log('✓ Tareas creadas (16)');

  await mongoose.disconnect();

  console.log(`
=== Seed completado ===

Credenciales:
  admin / admin123   → admin_users    (gestiona usuarios y asignaciones)
  pm    / pm123      → admin_projects → Proyecto Alpha, Proyecto Beta
  dev1  / dev1123    → member         → Proyecto Alpha
  dev2  / dev2123    → member         → Proyecto Beta
`);
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
