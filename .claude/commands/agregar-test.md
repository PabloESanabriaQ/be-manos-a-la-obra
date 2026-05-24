# Skill: Agregar test unitario

Guía para extraer la lógica de negocio a una capa de servicios y escribir unit tests sobre ella.

## Por qué una capa de servicios

Los controllers mezclan lógica HTTP (req/res) con lógica de negocio (DB, validaciones). Extraer los servicios permite testear la lógica de negocio en aislamiento, mockeando Mongoose sin levantar servidor ni DB.

---

## Setup inicial (solo la primera vez)

### Instalar dependencias
```bash
npm install -D vitest
```

### Crear `vitest.config.js` en la raíz
```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

### Actualizar `package.json`
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## Estructura de archivos

```
services/
  tasks.service.js
  projects.service.js
  epics.service.js
  stories.service.js
tests/
  tasks.service.test.js
  projects.service.test.js
  ...
```

---

## Cómo extraer un servicio desde un controller

Mover toda la lógica de negocio (llamadas a DB, validaciones, throws) a `services/{entidad}.service.js`. El servicio no conoce `req`, `res` ni `next`.

### Antes (en el controller)
```js
const updateTask = async (req, res, next) => {
  try {
    validateUpdateTask(req.body);
    const task = await Task.findById(req.params._id);
    if (!task) throw new NotFoundError('Task not found');
    if (req.body.story && task.story.toString() !== req.body.story.toString()) {
      throw new ValidationError('Cannot change the story of a task');
    }
    const result = await Task.findByIdAndUpdate(req.params._id, req.body, { new: true });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};
```

### Después — `services/tasks.service.js`
```js
const Task = require('../models/tasks.model');
const { validateCreateTask, validateUpdateTask } = require('../utils/validateTasks');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

const updateTask = async (id, body) => {
  validateUpdateTask(body);
  const task = await Task.findById(id);
  if (!task) throw new NotFoundError('Task not found');
  if (body.story && task.story.toString() !== body.story.toString()) {
    throw new ValidationError('Cannot change the story of a task');
  }
  return Task.findByIdAndUpdate(id, body, { new: true });
};

module.exports = { updateTask };
```

### Después — `controllers/tasks.controller.js`
```js
const tasksService = require('../services/tasks.service');

const updateTask = async (req, res, next) => {
  try {
    const result = await tasksService.updateTask(req.params._id, req.body);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};
```

El controller queda delgado: solo traduce HTTP ↔ servicio.

---

## Plantilla de test unitario

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mockear el modelo ANTES de importar el servicio
vi.mock('../models/tasks.model');

import Task from '../models/tasks.model';
import { updateTask, createTask, getTaskById } from '../services/tasks.service';
import NotFoundError from '../errors/NotFoundError';
import ValidationError from '../errors/ValidationError';

describe('TasksService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Tests aquí
});
```

---

## Plantillas por operación

### getAll
```js
it('getAll devuelve todos los items', async () => {
  const fakeTasks = [{ _id: '1', name: 'Tarea A' }];
  Task.find.mockResolvedValue(fakeTasks);

  const result = await getAllTasks();

  expect(Task.find).toHaveBeenCalledOnce();
  expect(result).toEqual(fakeTasks);
});
```

### getById — éxito y 404
```js
it('getById devuelve el item si existe', async () => {
  const fakeTask = { _id: '1', name: 'Tarea A' };
  Task.findById.mockResolvedValue(fakeTask);

  const result = await getTaskById('1');

  expect(Task.findById).toHaveBeenCalledWith('1');
  expect(result).toEqual(fakeTask);
});

it('getById lanza NotFoundError si no existe', async () => {
  Task.findById.mockResolvedValue(null);

  await expect(getTaskById('inexistente')).rejects.toThrow(NotFoundError);
});
```

### create — éxito y validación
```js
it('createTask guarda y devuelve el nuevo item', async () => {
  const input = { name: 'Nueva tarea', story: 'story-id' };
  const saved = { _id: 'nuevo-id', ...input };

  // Mockear la instancia y su método save()
  const mockInstance = { save: vi.fn().mockResolvedValue(saved) };
  Task.mockImplementation(() => mockInstance);

  const result = await createTask(input);

  expect(mockInstance.save).toHaveBeenCalledOnce();
  expect(result).toEqual(saved);
});

it('createTask lanza ValidationError si falta name', async () => {
  await expect(createTask({ story: 'story-id' })).rejects.toThrow(ValidationError);
});

it('createTask lanza ValidationError si falta story', async () => {
  await expect(createTask({ name: 'Tarea' })).rejects.toThrow(ValidationError);
});
```

### update — éxito, 404 y cambio de padre prohibido
```js
it('updateTask actualiza y devuelve el item modificado', async () => {
  const existing = { _id: '1', name: 'Antes', story: { toString: () => 'story-1' } };
  const updated = { _id: '1', name: 'Después', story: 'story-1' };

  Task.findById.mockResolvedValue(existing);
  Task.findByIdAndUpdate.mockResolvedValue(updated);

  const result = await updateTask('1', { _id: '1', name: 'Después', story: 'story-1' });

  expect(Task.findByIdAndUpdate).toHaveBeenCalledWith('1', expect.any(Object), { new: true });
  expect(result).toEqual(updated);
});

it('updateTask lanza NotFoundError si no existe', async () => {
  Task.findById.mockResolvedValue(null);

  await expect(updateTask('inexistente', { _id: 'x', name: 'x', story: 's' }))
    .rejects.toThrow(NotFoundError);
});

it('updateTask lanza ValidationError si se intenta cambiar la story', async () => {
  const existing = { _id: '1', name: 'Test', story: { toString: () => 'story-original' } };
  Task.findById.mockResolvedValue(existing);

  await expect(updateTask('1', { _id: '1', name: 'Test', story: 'story-nueva' }))
    .rejects.toThrow(ValidationError);
});
```

### delete
```js
it('deleteTask llama a findByIdAndDelete con el id correcto', async () => {
  Task.findByIdAndDelete.mockResolvedValue({ _id: '1' });

  await deleteTask('1');

  expect(Task.findByIdAndDelete).toHaveBeenCalledWith('1');
});
```

---

## Reglas del proyecto

- Los servicios no reciben `req`, `res` ni `next` — solo datos y devuelven resultados o lanzan errores
- Siempre mockear los modelos de Mongoose con `vi.mock('../models/...')` antes de importar el servicio
- Llamar `vi.clearAllMocks()` en `beforeEach` para aislar cada test
- Testear el path feliz Y todos los casos de error que el servicio puede lanzar
- Los unit tests no levantan servidor ni DB — son rápidos y no tienen efectos secundarios

## Checklist

- [ ] Setup inicial configurado (primera vez)
- [ ] Lógica extraída del controller al servicio correspondiente en `services/`
- [ ] Controller actualizado para llamar al servicio
- [ ] Archivo de test creado en `tests/{entidad}.service.test.js`
- [ ] Tests cubren: getAll, getById (éxito + 404), create (éxito + validación), update (éxito + 404 + cambio de padre), delete
- [ ] `npm test` pasa sin errores
