const express = require('express');
const router = express.Router();
const { getEpicById, getStoriesByEpic, getEpics  } = require('../controllers/epics.controller');

router.get('/', 
	(req, res) => {
    return getEpics(req, res);
  }
);

router.get('/:_id', 
	(req, res, next) => {
    return getEpicById(req, res, next);
  }
);

router.get('/:_id/stories', 
	(req, res, next) => {
    return getStoriesByEpic(req, res, next);
  }
);

module.exports = router;
