import Story from '../models/stories.model.js';
import Task from '../models/tasks.model.js';
import Epic from '../models/epics.model.js';
import Project from '../models/projects.model.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';
import { validateCreateStory, validateUpdateStory } from '../utils/validateStories.js';

const getAll = async (page = 1, limit = 20, userId, { assignedTo, status } = {}) => {
  const skip = (page - 1) * limit;
  const filter = { deletedAt: null };
  if (userId) {
    const projects = await Project.find({ 'members.user': userId }).select('_id');
    const epics = await Epic.find({ project: { $in: projects.map((p) => p._id) }, deletedAt: null }).select('_id');
    filter.epic = { $in: epics.map((e) => e._id) };
  }
  if (assignedTo) filter.assignedTo = assignedTo;
  if (status) filter.status = status;
  const [data, total] = await Promise.all([
    Story.find(filter).skip(skip).limit(limit),
    Story.countDocuments(filter),
  ]);
  return { data, total };
};

const getById = async (id) => {
  const story = await Story.findById(id)
    .populate('epic', 'project name')
    .populate('assignedTo', 'username name');
  if (!story || story.deletedAt) throw new NotFoundError('Story not found');
  return story;
};

const getTasksByStory = async (id) => {
  const story = await Story.findById(id);
  if (!story || story.deletedAt) throw new NotFoundError('Story not found');
  return Task.find({ story: id, deletedAt: null });
};

const validateAssignedTo = async (assignedTo, epicId) => {
  if (!assignedTo || assignedTo.length === 0) return;
  const epic = await Epic.findById(epicId);
  if (!epic) throw new NotFoundError('Epic not found');
  const project = await Project.findById(epic.project);
  if (!project) throw new NotFoundError('Project not found');
  const memberIds = project.members.map((m) => m.user.toString());
  for (const userId of assignedTo) {
    if (!memberIds.includes(userId.toString())) {
      throw new ValidationError(`User ${userId} is not a member of this project`);
    }
  }
};

const create = async (body) => {
  validateCreateStory(body);
  if (body.assignedTo) await validateAssignedTo(body.assignedTo, body.epic);
  return new Story(body).save();
};

const update = async (id, body) => {
  validateUpdateStory(body);
  const story = await Story.findById(id);
  if (!story || story.deletedAt) throw new NotFoundError('Story not found');
  if (body.epic && story.epic.toString() !== body.epic.toString()) {
    throw new ValidationError('Cannot change the epic of a story');
  }
  if (body.assignedTo) await validateAssignedTo(body.assignedTo, story.epic);
  return Story.findByIdAndUpdate(id, body, { new: true })
    .populate('epic', 'project name')
    .populate('assignedTo', 'username name');
};

const remove = async (id) => {
  const story = await Story.findById(id);
  if (!story || story.deletedAt) throw new NotFoundError('Story not found');
  const now = new Date();
  await Story.findByIdAndUpdate(id, { deletedAt: now });
  await Task.updateMany({ story: id, deletedAt: null }, { deletedAt: now });
};

export { getAll, getById, getTasksByStory, create, update, remove };
