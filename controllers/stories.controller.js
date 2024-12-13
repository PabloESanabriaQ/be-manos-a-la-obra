const Story = require('../models/stories.model');
const Task = require('../models/tasks.model');
const mongoose = require('mongoose');
//TODO: Crear las validaciones para la creación y actualización de stories:
//const { validateCreateStory, validateUpdateStory } = require('../utils/validateStories');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

const getStories = (req, res) => {
  Story.find()
  .then((result) => {
    res.status(200).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
}

const getStoryById = (req, res, next) => {
  Story.findById(req.params._id)
  .then((result) => {
    if (!result) {
        const err = new NotFoundError('Story not found');
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

const getTasksByStory = (req, res, next) => {
  const story = Story.findById(req.params._id);
  if (!story) {
    const err = new NotFoundError('Story not found');
    err.status = 404;
    throw err;
  }
  Task.find({story: req.params._id})
  .then((result) => {
    res.status(200).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
}

const createStory = (req, res, next) => {
  //validateCreateStory(req.body);
  const story = new Story(req.body);
  story.save()
  .then((result) => {
    res.status(201).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
}

const updateStory = (req, res, next) => {
  //validateUpdateStory(req.body);
  const story = Story.findById(req.params._id);
  const newStory = new Story(req.body);
  if(story.epic !== newStory.epic) {
    throw new ValidationError('Cannot change the epic of a story');
  }
  
  Story.findByIdAndUpdate(req.params._id, newStory, {new: true});
}

module.exports = { 
  getStories, 
  getStoryById,
  createStory,
  updateStory,
  getTasksByStory
}
