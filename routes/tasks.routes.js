const express = require('express');
const router = express.Router();
const { 
  getTasks, 
  getTaskById, 
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/tasks.controller');

router.get('/', 
	(req, res) => {
    return getTasks(req, res);
  }
);

router.get('/:_id', 
	(req, res, next) => {
    return getTaskById(req, res, next)
  }
);

router.post('/', 
  (req, res, next) => {
    return createTask(req, res, next)
  }
)

router.put('/:_id', 
  (req, res, next) => {
    return updateTask(req, res, next)
  }
);

router.patch('/:_id', 
  (req, res, next) => {
    return updateTask(req, res, next)
  }
);

router.delete('/:_id', 
  (req, res, next) => {
    return deleteTask(req, res, next)
  }
);

module.exports = router;
