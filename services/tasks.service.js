import Task from '../models/tasks.model.js';
import { validateCreateTask, validateUpdateTask } from '../utils/validateTasks.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';

const getAll = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Task.find().skip(skip).limit(limit),
    Task.countDocuments(),
  ]);
  return { data, total };
};

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

export { getAll, getById, create, update, remove };
