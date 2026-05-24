import Project from '../models/projects.model.js';
import Epic from '../models/epics.model.js';
import NotFoundError from '../errors/NotFoundError.js';

const getAll = () => Project.find();

const getById = async (id) => {
  const project = await Project.findById(id);
  if (!project) throw new NotFoundError('Project not found');
  return project;
};

const getEpicsByProject = async (id) => {
  const project = await Project.findById(id);
  if (!project) throw new NotFoundError('Project not found');
  return Epic.find({ project: id });
};

const create = (body) => new Project(body).save();

const update = async (id, body) => {
  const result = await Project.findByIdAndUpdate(id, body, { new: true });
  if (!result) throw new NotFoundError('Project not found');
  return result;
};

const remove = (id) => Project.findByIdAndDelete(id);

export { getAll, getById, getEpicsByProject, create, update, remove };
