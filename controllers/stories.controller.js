const Story = require('../models/stories.model');
const Task = require('../models/tasks.model');
const mongoose = require('mongoose');
//TODO: Crear las validaciones para la creación y actualización de stories:
//const { validateCreateStory, validateUpdateStory } = require('../utils/validateStories');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

const getStories = (req, res, next) => {
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

const getTasksByStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params._id);
    if (!story) {
      throw new NotFoundError('Story not found');
    }
    const result = await Task.find({ story: req.params._id });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
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

const updateStory = async (req, res, next) => {
  //validateUpdateStory(req.body);
  try {
    const story = await Story.findById(req.params._id);
    if (!story) {
      throw new NotFoundError('Story not found');
    }
    if (req.body.epic && story.epic.toString() !== req.body.epic.toString()) {
      throw new ValidationError('Cannot change the epic of a story');
    }
    const result = await Story.findByIdAndUpdate(req.params._id, req.body, { new: true });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { 
  getStories, 
  getStoryById,
  createStory,
  updateStory,
  getTasksByStory
}
