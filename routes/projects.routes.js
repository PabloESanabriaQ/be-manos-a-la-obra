const express = require('express');
const router = express.Router();
const { 
  getProjectById, 
  getProjects, 
  getEpicsByProject, 
  updateProject, 
  createProject,
  deleteProject 
} = require('../controllers/projects.controller');


router.get('/', 
	(req, res) => {
    return getProjects(req, res);
  }
);

router.get('/:_id', 
	(req, res, next) => {
    return getProjectById(req, res. next);
  }
);

router.get('/:_id/epics', 
	(req, res, next) => {
    return getEpicsByProject(req, res. next);
  }
);

router.post('/', 
  (req, res, next) => {
    return createProject(req, res, next)
  }
)

router.put('/:_id', 
  (req, res, next) => {
    return updateProject(req, res, next)
  }
);

router.patch('/:_id', 
  (req, res, next) => {
    return updateProject(req, res, next)
  }
);

router.delete('/:_id', 
  (req, res, next) => {
    return deleteProject(req, res, next)
  }
);

module.exports = router;
