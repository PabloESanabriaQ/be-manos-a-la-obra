import Task from '../models/tasks.model.js';
import { validateCreateTask, validateUpdateTask } from '../utils/validateTasks.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';

const getAll = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Task.find({ deletedAt: null }).skip(skip).limit(limit),
    Task.countDocuments({ deletedAt: null }),
  ]);
  return { data, total };
};

const getById = async (id) => {
  const task = await Task.findById(id);
  if (!task || task.deletedAt) throw new NotFoundError('Task not found');
  return task;
};

const create = (body) => {
  validateCreateTask(body);
  return new Task(body).save();
};

const update = async (id, body) => {
  validateUpdateTask(body);
  const task = await Task.findById(id);
  if (!task || task.deletedAt) throw new NotFoundError('Task not found');
  if (body.story && task.story.toString() !== body.story.toString()) {
    throw new ValidationError('Cannot change the story of a task');
  }
  return Task.findByIdAndUpdate(id, body, { new: true });
};

const remove = (id) => Task.findByIdAndUpdate(id, { deletedAt: new Date() });

export { getAll, getById, create, update, remove };
