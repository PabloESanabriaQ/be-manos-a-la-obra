const express = require('express');
const loginRouter = require('./routes/login.routes');
const epicsRouter = require('./routes/epics.routes')
const projectsRouter = require('./routes/projects.routes')
const storiesRouter = require('./routes/stories.routes')
const tasksRouter = require('./routes/tasks.routes')
const usersRouter = require('./routes/users.routes');
const mongoDbConnection = require('./db/mongoDbConnection');
const errorHandler = require('./middlewares/errorHandler');
const authMiddleware = require('./middlewares/authentication');

const app = express();

mongoDbConnection();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Running in port: " + PORT));

app.use(express.json());

//TODO: no olvidar CORS cuando lo conecte al front

app.use('/api/login', loginRouter);
app.use('/api/epics', authMiddleware , epicsRouter);
app.use('/api/projects',authMiddleware , projectsRouter);
app.use('/api/stories', authMiddleware, storiesRouter);
app.use('/api/tasks', authMiddleware,tasksRouter);
app.use('/api/users', authMiddleware, usersRouter);

app.use(errorHandler);
