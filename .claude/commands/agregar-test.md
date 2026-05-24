# Skill: Agregar test unitario

Guía para escribir unit tests sobre los servicios en `services/`.

Los servicios contienen toda la lógica de negocio (DB, validaciones, errores de dominio) sin conocimiento de HTTP. Los controllers son delgados y solo traducen HTTP ↔ servicio. Esta separación permite testear la lógica en aislamiento mockeando Mongoose sin levantar servidor ni DB.

---

## Setup

Ya configurado. El proyecto usa Vitest con `vitest.config.js` en la raíz y los scripts `npm test` / `npm run test:watch`.

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

## Plantilla de test unitario

El proyecto usa ESM. El mock debe declararse con factory explícita usando `function` (no arrow) para soportar `new`. `vi.mock` se hoist automáticamente al tope del archivo.

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/{entidad}.model.js', () => {
  const Mock = vi.fn(function() { return { save: vi.fn() }; });
  Mock.find = vi.fn();
  Mock.findById = vi.fn();
  Mock.findByIdAndUpdate = vi.fn();
  Mock.findByIdAndDelete = vi.fn();
  return { default: Mock };
});

import Model from '../models/{entidad}.model.js';
import { getAll, getById, create, update, remove } from '../services/{entidad}.service.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';

describe('{Entidad}Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Tests aquí
});
```

Ver `tests/tasks.service.test.js` como archivo de referencia completo.

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
