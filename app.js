import 'dotenv/config';
import express from 'express';
import mongoDbConnection from './db/mongoDbConnection.js';
import errorHandler from './middlewares/errorHandler.js';
import authMiddleware from './middlewares/authentication.js';
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

app.use(express.json());

//TODO: no olvidar CORS cuando lo conecte al front

app.use('/api/login', loginRouter);
app.use('/api/epics', authMiddleware, epicsRouter);
app.use('/api/projects', authMiddleware, projectsRouter);
app.use('/api/stories', authMiddleware, storiesRouter);
app.use('/api/tasks', authMiddleware, tasksRouter);
app.use('/api/users', authMiddleware, usersRouter);

app.use(errorHandler);

export default app;
