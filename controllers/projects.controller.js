const Project = require('../models/projects.model');
const Epic = require('../models/epics.model');
//TODO: Crear las validaciones para la creación, eliminación y actualización de proyectos:
//const { validateCreateProject, validateUpdateProject } = require('../utils/validateProjects');
const NotFoundError = require('../errors/NotFoundError');

const getProjects = (req, res) => {
  Project.find()
  .then((result) => {
    res.status(200).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
}

const getProjectById = (req, res, next) => {
  Project.findById(req.params._id)
  .then((result) => {
    if (!result) {
        const err = new NotFoundError('Project not found');
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

const getEpicsByProject = (req, res, next) => {
  const project = Project.findById(req.params._id);
  if (!project) {
    const err = new NotFoundError('Project not found');
    err.status = 404;
    throw err;
  }
  Epic.find({story: req.params._id})
  .then((result) => {
    res.status(200).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
}

const createProject = (req, res, next) => {
  //validateCreateProject(req.body);
  const project = new Project(req.body);
  project.save()
  .then((result) => {
    res.status(201).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
}

const updateProject = (req, res, next) => {
  //validateUpdateProject(req.body);
  const newProject = new Project(req.body);
  
  Task.findByIdAndUpdate(req.params._id, newProject, {new: true});
}

const deleteProject = (req, res, next) => {
  //validateDeleteProject(req.body);
  Project.findByIdAndDelete(req.params._id)
  .then((result) => {
    res.status(200).json({
      data: result
    });
  })
}

module.exports = { 
  getProjects,
  getProjectById,
  getEpicsByProject,
  createProject,
  updateProject,
  deleteProject
}
