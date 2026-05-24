const Task = require('../models/tasks.model');
const { validateCreateTask, validateUpdateTask } = require('../utils/validateTasks');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

const getAll = () => Task.find();

const getById = async (id) => {
  const task = await Task.findById(id);
  if (!task) throw new NotFoundError('Task not found');
  return task;
};

const create = (body) => {
  validateCreateTask(body);
  return new Task(body).save();
};

const update = async (id, body) => {
  validateUpdateTask(body);
  const task = await Task.findById(id);
  if (!task) throw new NotFoundError('Task not found');
  if (body.story && task.story.toString() !== body.story.toString()) {
    throw new ValidationError('Cannot change the story of a task');
  }
  return Task.findByIdAndUpdate(id, body, { new: true });
};

const remove = (id) => Task.findByIdAndDelete(id);

module.exports = { getAll, getById, create, update, remove };
