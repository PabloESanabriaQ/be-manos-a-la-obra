import Task from '../models/tasks.model.js';
import Story from '../models/stories.model.js';
import Epic from '../models/epics.model.js';
import Project from '../models/projects.model.js';
import { validateCreateTask, validateUpdateTask } from '../utils/validateTasks.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';

const getAll = async (page = 1, limit = 20, userId) => {
  const skip = (page - 1) * limit;
  const filter = { deletedAt: null };
  if (userId) {
    const projects = await Project.find({ 'members.user': userId }).select('_id');
    const epics = await Epic.find({ project: { $in: projects.map((p) => p._id) }, deletedAt: null }).select('_id');
    const stories = await Story.find({ epic: { $in: epics.map((e) => e._id) }, deletedAt: null }).select('_id');
    filter.story = { $in: stories.map((s) => s._id) };
  }
  const [data, total] = await Promise.all([
    Task.find(filter).skip(skip).limit(limit),
    Task.countDocuments(filter),
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
