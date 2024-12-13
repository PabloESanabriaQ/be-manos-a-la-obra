const Task = require('../models/tasks.model');
const { validateCreateTask, validateUpdateTask } = require('../utils/validateTasks');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

const getTasks = (req, res) => {
  Task.find()
  .then((result) => {
    res.status(200).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
}

const getTaskById = (req, res, next) => {
  Task.findById(req.params._id)
  .then((result) => {
    if (!result) {
        const err = new NotFoundError('Task not found');
        err.status = 404;
        throw err;
    }
    res.status(200).json({
      data: result
    });
  })
  .catch((err) => {
    next(err);
  });
}

const createTask = (req, res, next) => {
  validateCreateTask(req.body);
  const task = new Task(req.body);
  task.save()
  .then((result) => {
    res.status(201).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
}

const updateTask = (req, res, next) => {
  validateUpdateTask(req.body);
  const task = Task.findById(req.params._id);
  const newTask = new Task(req.body);
  if(task.story !== newTask.story) {
    throw new ValidationError('Cannot change the story of a task');
  }
  
  Task.findByIdAndUpdate(req.params._id, newTask, {new: true});
}

const deleteTask = (req, res, next) => {
  //validateDeleteTask(req.body);
  Task.findByIdAndDelete(req.params._id)
  .then((result) => {
    res.status(200).json({
      data: result
    });
  })
  .catch((err) => {
    next(err);
  });
}

module.exports = { 
  getTasks, 
  getTaskById,
  createTask,
  updateTask,
  deleteTask
}
