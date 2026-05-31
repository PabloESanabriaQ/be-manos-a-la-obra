import * as storiesService from '../services/stories.service.js';

const getStories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { assignedTo, status } = req.query;
    const { data, total } = await storiesService.getAll(page, limit, req.userId, { assignedTo, status });
    res.status(200).json({ data, pagination: { page, limit, total } });
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

const deleteStory = async (req, res, next) => {
  try {
    await storiesService.remove(req.params._id);
    res.status(200).json({ data: null });
  } catch (err) {
    next(err);
  }
};

export { getStories, getStoryById, getTasksByStory, createStory, updateStory, deleteStory };
