import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Manos a la Obra API',
      version: '1.0.0',
      description: 'API REST para gestión de proyectos, épicas, historias y tareas',
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 3000}/api`, description: 'Desarrollo' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'Cookie de sesión obtenida al hacer POST /api/login',
        },
      },
      parameters: {
        idParam: {
          in: 'path',
          name: '_id',
          required: true,
          schema: { type: 'string' },
          description: 'ID del recurso (MongoDB ObjectId)',
        },
        pageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1, minimum: 1 },
          description: 'Número de página',
        },
        limitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          description: 'Resultados por página',
        },
      },
      schemas: {
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 42 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Descripción del error' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e1' },
            name: { type: 'string', example: 'Proyecto Alpha' },
            description: { type: 'string', example: 'Descripción del proyecto' },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e2' },
                  role: { type: 'string', enum: ['admin_projects', 'member'] },
                },
              },
            },
          },
        },
        ProjectInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Proyecto Alpha' },
            description: { type: 'string', example: 'Descripción del proyecto' },
            members: {
              type: 'array',
              items: {
                type: 'object',
                required: ['user', 'role'],
                properties: {
                  user: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e2' },
                  role: { type: 'string', enum: ['admin_projects', 'member'] },
                },
              },
            },
          },
        },
        ProjectCreateInput: {
          type: 'object',
          required: ['name', 'adminId'],
          properties: {
            name: { type: 'string', example: 'Proyecto Alpha' },
            description: { type: 'string', example: 'Descripción del proyecto' },
            adminId: {
              type: 'string',
              example: '64a1f2c3d4e5f6a7b8c9d0e2',
              description: 'ID del usuario que será admin_projects del nuevo proyecto. Debe existir y estar activo.',
            },
          },
        },
        Epic: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e1' },
            name: { type: 'string', example: 'Autenticación de usuarios' },
            description: { type: 'string' },
            project: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e2', description: 'ID del proyecto' },
          },
        },
        EpicInput: {
          type: 'object',
          required: ['name', 'project'],
          properties: {
            name: { type: 'string', example: 'Autenticación de usuarios' },
            description: { type: 'string' },
            project: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e2' },
          },
        },
        Story: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e1' },
            name: { type: 'string', example: 'Como usuario quiero poder registrarme' },
            description: { type: 'string' },
            epic: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e2', description: 'ID de la épica' },
            points: { type: 'integer', minimum: 0, maximum: 5, example: 3 },
            status: { type: 'string', enum: ['todo', 'running', 'done'], example: 'todo' },
          },
        },
        StoryInput: {
          type: 'object',
          required: ['name', 'epic'],
          properties: {
            name: { type: 'string', example: 'Como usuario quiero poder registrarme' },
            description: { type: 'string' },
            epic: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e2' },
            points: { type: 'integer', minimum: 0, maximum: 5, example: 3 },
            status: { type: 'string', enum: ['todo', 'running', 'done'], example: 'todo' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e1' },
            name: { type: 'string', example: 'Implementar endpoint de registro' },
            description: { type: 'string' },
            story: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e2', description: 'ID de la historia' },
            status: { type: 'string', enum: ['todo', 'running', 'done'], example: 'todo' },
            dueDate: { type: 'string', format: 'date-time' },
            done: { type: 'boolean', example: false },
          },
        },
        TaskInput: {
          type: 'object',
          required: ['name', 'story'],
          properties: {
            name: { type: 'string', example: 'Implementar endpoint de registro' },
            description: { type: 'string' },
            story: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e2' },
            status: { type: 'string', enum: ['todo', 'running', 'done'], example: 'todo' },
            dueDate: { type: 'string', format: 'date-time' },
            done: { type: 'boolean', example: false },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1f2c3d4e5f6a7b8c9d0e1' },
            username: { type: 'string', example: 'pablo' },
            email: { type: 'string', format: 'email', example: 'pablo@example.com' },
            name: {
              type: 'object',
              properties: {
                first: { type: 'string', example: 'Pablo' },
                last: { type: 'string', example: 'Sanabria' },
              },
            },
            role: { type: 'string', enum: ['admin_users', 'admin_projects', 'member'], example: 'member' },
            active: { type: 'boolean', example: true },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ['./routes/*.js', './app.js'],
};

export default swaggerJsdoc(options);
