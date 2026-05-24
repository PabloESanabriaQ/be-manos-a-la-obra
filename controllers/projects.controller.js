import * as projectsService from '../services/projects.service.js';

const getProjects = async (req, res, next) => {
  try {
    const result = await projectsService.getAll();
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const result = await projectsService.getById(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getEpicsByProject = async (req, res, next) => {
  try {
    const result = await projectsService.getEpicsByProject(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  try {
    const result = await projectsService.create(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const result = await projectsService.update(req.params._id, req.body);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const result = await projectsService.remove(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export { getProjects, getProjectById, getEpicsByProject, createProject, updateProject, deleteProject };
