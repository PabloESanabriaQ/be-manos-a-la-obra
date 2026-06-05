import Project from '../models/projects.model.js';
import Epic from '../models/epics.model.js';
import Story from '../models/stories.model.js';
import Task from '../models/tasks.model.js';
import User from '../models/users.model.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';
import { validateCreateProject, validateUpdateProject } from '../utils/validateProjects.js';

const getAll = async (page = 1, limit = 20, userId, userRole) => {
  const skip = (page - 1) * limit;
  const filter = { deletedAt: null };
  if (userRole !== 'admin_users' && userId) {
    filter['members.user'] = userId;
  }
  const [data, total] = await Promise.all([
    Project.find(filter).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);
  return { data, total };
};

const getById = async (id) => {
  const project = await Project.findById(id).populate('members.user', 'username name');
  if (!project || project.deletedAt) throw new NotFoundError('Project not found');
  return project;
};

const getEpicsByProject = async (id) => {
  const project = await Project.findById(id);
  if (!project || project.deletedAt) throw new NotFoundError('Project not found');
  return Epic.find({ project: id, deletedAt: null });
};

const create = async (body) => {
  validateCreateProject(body);
  const admin = await User.findById(body.adminId);
  if (!admin || !admin.active) {
    throw new ValidationError('Admin user not found or inactive');
  }
  return new Project({
    name: body.name,
    description: body.description,
    icon: body.icon,
    members: [{ user: admin._id, role: 'admin_projects' }],
  }).save();
};

const update = async (id, body) => {
  validateUpdateProject(body);
  const project = await Project.findById(id);
  if (!project || project.deletedAt) throw new NotFoundError('Project not found');
  return Project.findByIdAndUpdate(id, body, { new: true });
};

const remove = async (id) => {
  const now = new Date();
  await Project.findByIdAndUpdate(id, { deletedAt: now });
  const epics = await Epic.find({ project: id, deletedAt: null }).select('_id');
  if (epics.length) {
    const epicIds = epics.map((e) => e._id);
    await Epic.updateMany({ _id: { $in: epicIds } }, { deletedAt: now });
    const stories = await Story.find({ epic: { $in: epicIds }, deletedAt: null }).select('_id');
    if (stories.length) {
      const storyIds = stories.map((s) => s._id);
      await Story.updateMany({ _id: { $in: storyIds } }, { deletedAt: now });
      await Task.updateMany({ story: { $in: storyIds }, deletedAt: null }, { deletedAt: now });
    }
  }
};

const updateMembers = async (id, members) => {
  const project = await Project.findById(id);
  if (!project || project.deletedAt) throw new NotFoundError('Project not found');
  return Project.findByIdAndUpdate(id, { members }, { new: true });
};

export { getAll, getById, getEpicsByProject, create, update, remove, updateMembers };
