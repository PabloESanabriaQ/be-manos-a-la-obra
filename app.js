import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import mongoDbConnection from './db/mongoDbConnection.js';
import errorHandler from './middlewares/errorHandler.js';
import authMiddleware from './middlewares/authentication.js';
import { logout } from './controllers/auth.controller.js';
import loginRouter from './routes/login.routes.js';
import epicsRouter from './routes/epics.routes.js';
import projectsRouter from './routes/projects.routes.js';
import storiesRouter from './routes/stories.routes.js';
import tasksRouter from './routes/tasks.routes.js';
import usersRouter from './routes/users.routes.js';

const app = express();

mongoDbConnection();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log('Running in port: ' + PORT));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/login', loginRouter);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Elimina la cookie de autenticación.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout exitoso
 */
app.post('/api/logout', logout);
app.use('/api/epics', authMiddleware, epicsRouter);
app.use('/api/projects', authMiddleware, projectsRouter);
app.use('/api/stories', authMiddleware, storiesRouter);
app.use('/api/tasks', authMiddleware, tasksRouter);
app.use('/api/users', authMiddleware, usersRouter);

app.use(errorHandler);

export default app;
