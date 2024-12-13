const express = require('express');
const router = express.Router();
const { getStoryById, getStories, getTasksByStory  } = require('../controllers/stories.controller');


router.get('/', 
	(req, res) => {
    return getStories(req, res);
  }
);

router.get('/:_id', 
	(req, res, next) => {
    return getStoryById(req, res, next)
  }
);

router.get('/:_id/tasks', 
	(req, res, next) => {
    return getTasksByStory(req, res, next);
  }
);

module.exports = router;
