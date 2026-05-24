import * as storiesService from '../services/stories.service.js';

const getStories = async (req, res, next) => {
  try {
    const result = await storiesService.getAll();
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getStoryById = async (req, res, next) => {
  try {
    const result = await storiesService.getById(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getTasksByStory = async (req, res, next) => {
  try {
    const result = await storiesService.getTasksByStory(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const createStory = async (req, res, next) => {
  try {
    const result = await storiesService.create(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const updateStory = async (req, res, next) => {
  try {
    const result = await storiesService.update(req.params._id, req.body);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export { getStories, getStoryById, getTasksByStory, createStory, updateStory };
