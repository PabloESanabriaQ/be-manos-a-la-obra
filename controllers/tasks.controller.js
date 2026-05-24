const Task = require('../models/tasks.model');
const { validateCreateTask, validateUpdateTask } = require('../utils/validateTasks');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

const getTasks = (req, res, next) => {
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

const updateTask = async (req, res, next) => {
  try {
    validateUpdateTask(req.body);
    const task = await Task.findById(req.params._id);
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    if (req.body.story && task.story.toString() !== req.body.story.toString()) {
      throw new ValidationError('Cannot change the story of a task');
    }
    const result = await Task.findByIdAndUpdate(req.params._id, req.body, { new: true });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
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
