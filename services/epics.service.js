import Epic from '../models/epics.model.js';
import Story from '../models/stories.model.js';
import Task from '../models/tasks.model.js';
import Project from '../models/projects.model.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';
import { validateCreateEpic, validateUpdateEpic } from '../utils/validateEpics.js';

const getAll = async (page = 1, limit = 20, userId) => {
  const skip = (page - 1) * limit;
  const filter = { deletedAt: null };
  if (userId) {
    const projects = await Project.find({ 'members.user': userId }).select('_id');
    filter.project = { $in: projects.map((p) => p._id) };
  }
  const [data, total] = await Promise.all([
    Epic.find(filter).skip(skip).limit(limit),
    Epic.countDocuments(filter),
  ]);
  return { data, total };
};

const getById = async (id) => {
  const epic = await Epic.findById(id);
  if (!epic || epic.deletedAt) throw new NotFoundError('Epic not found');
  return epic;
};

const getStoriesByEpic = async (id) => {
  const epic = await Epic.findById(id);
  if (!epic || epic.deletedAt) throw new NotFoundError('Epic not found');
  return Story.find({ epic: id, deletedAt: null });
};

const create = (body) => {
  validateCreateEpic(body);
  return new Epic(body).save();
};

const update = async (id, body) => {
  validateUpdateEpic(body);
  const epic = await Epic.findById(id);
  if (!epic || epic.deletedAt) throw new NotFoundError('Epic not found');
  if (body.project && epic.project.toString() !== body.project.toString()) {
    throw new ValidationError('Cannot change the project of an epic');
  }
  return Epic.findByIdAndUpdate(id, body, { new: true });
};

const remove = async (id) => {
  const epic = await Epic.findById(id);
  if (!epic || epic.deletedAt) throw new NotFoundError('Epic not found');
  const now = new Date();
  await Epic.findByIdAndUpdate(id, { deletedAt: now });
  const stories = await Story.find({ epic: id, deletedAt: null }).select('_id');
  if (stories.length) {
    const storyIds = stories.map((s) => s._id);
    await Story.updateMany({ _id: { $in: storyIds } }, { deletedAt: now });
    await Task.updateMany({ story: { $in: storyIds }, deletedAt: null }, { deletedAt: now });
  }
};

export { getAll, getById, getStoriesByEpic, create, update, remove };
