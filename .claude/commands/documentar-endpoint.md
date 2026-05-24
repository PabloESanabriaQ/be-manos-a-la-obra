# Skill: Documentar endpoint

Guía para documentar los endpoints de la API usando Swagger/OpenAPI con `swagger-jsdoc` y `swagger-ui-express`.

## Setup inicial (solo la primera vez)

### Instalar dependencias
```bash
npm install swagger-jsdoc swagger-ui-express
```

### Crear archivo de configuración `docs/swagger.js`
```js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Manos a la Obra API',
      version: '1.0.0',
      description: 'API para gestión de proyectos, épicas, historias y tareas',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.routes.js'],
};

module.exports = swaggerJsdoc(options);
```

### Registrar en `app.js`
```js
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

La documentación quedará disponible en `http://localhost:3000/api/docs`.

---

## Cómo documentar un endpoint

La documentación se escribe con comentarios JSDoc directamente en el archivo de rutas correspondiente (`routes/{entidad}.routes.js`), justo antes de cada `router.{method}(...)`.

### Estructura base de un comentario JSDoc

```js
/**
 * @swagger
 * /api/{entidades}:
 *   {method}:
 *     summary: Descripción corta
 *     tags: [{Entidad}]
 *     security:
 *       - bearerAuth: []
 *     parameters: ...      # solo para GET con parámetros o path params
 *     requestBody: ...     # solo para POST y PUT
 *     responses:
 *       {código}: ...
 */
```

---

## Plantillas por tipo de operación

### GET lista — `GET /api/{entidades}`
```js
/**
 * @swagger
 * /api/{entidades}:
 *   get:
 *     summary: Obtiene todos los {entidades}
 *     tags: [{Entidad}]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de {entidades}
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/{Entidad}'
 *       401:
 *         description: No autorizado
 */
```

### GET por ID — `GET /api/{entidades}/:_id`
```js
/**
 * @swagger
 * /api/{entidades}/{_id}:
 *   get:
 *     summary: Obtiene un {entidad} por ID
 *     tags: [{Entidad}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del {entidad}
 *     responses:
 *       200:
 *         description: '{Entidad} encontrado'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/{Entidad}'
 *       404:
 *         description: '{Entidad} no encontrado'
 *       401:
 *         description: No autorizado
 */
```

### POST — `POST /api/{entidades}`
```js
/**
 * @swagger
 * /api/{entidades}:
 *   post:
 *     summary: Crea un nuevo {entidad}
 *     tags: [{Entidad}]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/{Entidad}Input'
 *     responses:
 *       201:
 *         description: '{Entidad} creado correctamente'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/{Entidad}'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
```

### PUT — `PUT /api/{entidades}/:_id`
```js
/**
 * @swagger
 * /api/{entidades}/{_id}:
 *   put:
 *     summary: Actualiza un {entidad}
 *     tags: [{Entidad}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/{Entidad}Input'
 *     responses:
 *       200:
 *         description: '{Entidad} actualizado correctamente'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: '{Entidad} no encontrado'
 *       401:
 *         description: No autorizado
 */
```

### DELETE — `DELETE /api/{entidades}/:_id`
```js
/**
 * @swagger
 * /api/{entidades}/{_id}:
 *   delete:
 *     summary: Elimina un {entidad}
 *     tags: [{Entidad}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: '{Entidad} eliminado correctamente'
 *       404:
 *         description: '{Entidad} no encontrado'
 *       401:
 *         description: No autorizado
 */
```

---

## Definir schemas de componentes

Los schemas reutilizables se declaran en el mismo archivo de rutas o en un archivo dedicado `docs/schemas/{entidad}.js`. Usar `$ref` para referenciarlos en las respuestas.

```js
/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         story:
 *           type: string
 *           description: ID de la story asociada
 *         done:
 *           type: boolean
 *         created:
 *           type: string
 *           format: date-time
 *         dueDate:
 *           type: string
 *           format: date-time
 *     TaskInput:
 *       type: object
 *       required:
 *         - name
 *         - story
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         story:
 *           type: string
 *         done:
 *           type: boolean
 *         dueDate:
 *           type: string
 *           format: date-time
 */
```

---

## Checklist

- [ ] Setup de swagger-jsdoc configurado (primera vez)
- [ ] Schema del recurso definido con `@swagger components/schemas`
- [ ] Comentario JSDoc agregado para cada endpoint del router
- [ ] Todos los posibles status codes documentados (200/201, 400, 401, 404)
- [ ] `requestBody` presente en POST y PUT
- [ ] `parameters` presente en rutas con `/:_id`
- [ ] Verificar que `/api/docs` muestre los nuevos endpoints correctamente
