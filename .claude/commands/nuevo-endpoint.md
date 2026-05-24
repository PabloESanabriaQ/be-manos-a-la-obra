# Skill: Nuevo endpoint

Guía al usuario para agregar un endpoint nuevo manteniendo la consistencia del proyecto. Seguí estos pasos en orden.

## 1. Identificar el recurso y la operación

Preguntá (o inferí del contexto):
- ¿Qué recurso involucra? (`projects`, `epics`, `stories`, `tasks`, o uno nuevo)
- ¿Qué operación es? (GET lista, GET por id, GET anidado, POST, PUT, DELETE)
- ¿Requiere autenticación? (por defecto sí; solo `/api/login` es público)

## 2. Modelo (solo si es un recurso nuevo)

Crear `models/{entidad}.model.js` siguiendo este patrón:

```js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const {entidad}Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  // Referencias a otros documentos:
  parentId: { type: Schema.Types.ObjectId, ref: ParentModel, required: true },
});

module.exports = mongoose.model('{entidad}', {entidad}Schema);
```

## 3. Validación

Si la operación es POST o PUT, agregar las funciones de validación en `utils/validate{Entidad}.js`:

```js
const ValidationError = require('../errors/ValidationError');

const validateCreate{Entidad} = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
  if (!body.parentId) throw new ValidationError('{Entidad} must be associated with a parent');
};

const validateUpdate{Entidad} = (body) => {
  if (!body._id) throw new ValidationError('{Entidad} ID is required');
  if (!body.name) throw new ValidationError('Name is required');
};

module.exports = { validateCreate{Entidad}, validateUpdate{Entidad} };
```

## 4. Controller

Agregar la función en `controllers/{entidad}.controller.js`. Aplicar estas reglas:

**Operaciones simples** (una sola llamada a DB, sin lógica condicional): usar `.then()/.catch()`.
**Operaciones complejas** (múltiples llamadas a DB, validaciones de negocio): usar `async/await` con `try/catch`.

Siempre incluir `next` en la firma: `(req, res, next)`.

### GET lista
```js
const getAll = (req, res, next) => {
  Model.find()
    .then((result) => res.status(200).json({ data: result }))
    .catch((err) => next(err));
};
```

### GET por ID
```js
const getById = (req, res, next) => {
  Model.findById(req.params._id)
    .then((result) => {
      if (!result) throw new NotFoundError('{Entidad} not found');
      res.status(200).json({ data: result });
    })
    .catch((err) => next(err));
};
```

### GET anidado (recursos hijos de un padre)
```js
const getChildrenByParent = async (req, res, next) => {
  try {
    const parent = await ParentModel.findById(req.params._id);
    if (!parent) throw new NotFoundError('Parent not found');
    const result = await ChildModel.find({ parentField: req.params._id });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};
```

### POST
```js
const create = (req, res, next) => {
  validateCreate{Entidad}(req.body);
  const item = new Model(req.body);
  item.save()
    .then((result) => res.status(201).json({ data: result }))
    .catch((err) => next(err));
};
```

### PUT (no se puede cambiar la referencia al padre)
```js
const update = async (req, res, next) => {
  try {
    validateUpdate{Entidad}(req.body);
    const item = await Model.findById(req.params._id);
    if (!item) throw new NotFoundError('{Entidad} not found');
    if (req.body.parentId && item.parentId.toString() !== req.body.parentId.toString()) {
      throw new ValidationError('Cannot change the parent of a {entidad}');
    }
    const result = await Model.findByIdAndUpdate(req.params._id, req.body, { new: true });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};
```

### DELETE
```js
const remove = (req, res, next) => {
  Model.findByIdAndDelete(req.params._id)
    .then((result) => res.status(200).json({ data: result }))
    .catch((err) => next(err));
};
```

Exportar todas las funciones al final:
```js
module.exports = { getAll, getById, create, update, remove };
```

## 5. Route

En `routes/{entidad}.routes.js`, registrar cada handler envuelto en una arrow function:

```js
const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/{entidad}.controller');

router.get('/', (req, res, next) => getAll(req, res, next));
router.get('/:_id', (req, res, next) => getById(req, res, next));
router.post('/', (req, res, next) => create(req, res, next));
router.put('/:_id', (req, res, next) => update(req, res, next));
router.delete('/:_id', (req, res, next) => remove(req, res, next));

module.exports = router;
```

## 6. Registrar en app.js (solo si es un recurso nuevo)

Agregar en `app.js` junto a los demás routers, con `authMiddleware` salvo que sea público:

```js
const {entidad}Router = require('./routes/{entidad}.routes');
// ...
app.use('/api/{entidades}', authMiddleware, {entidad}Router);
```

## 7. Checklist final

- [ ] Modelo creado (si aplica)
- [ ] Validaciones en `utils/`
- [ ] Controller con firma `(req, res, next)` en todos los handlers
- [ ] Todos los paths de error llaman a `next(err)`
- [ ] Todos los paths de éxito envían respuesta HTTP
- [ ] Rutas registradas en el router
- [ ] Router registrado en `app.js` (si aplica)
