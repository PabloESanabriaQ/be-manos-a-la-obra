const tasksService = require('../services/tasks.service');

const getTasks = async (req, res, next) => {
  try {
    const result = await tasksService.getAll();
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const result = await tasksService.getById(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const result = await tasksService.create(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const result = await tasksService.update(req.params._id, req.body);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const result = await tasksService.remove(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
