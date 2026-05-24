const epicsService = require('../services/epics.service');

const getEpics = async (req, res, next) => {
  try {
    const result = await epicsService.getAll();
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getEpicById = async (req, res, next) => {
  try {
    const result = await epicsService.getById(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getStoriesByEpic = async (req, res, next) => {
  try {
    const result = await epicsService.getStoriesByEpic(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const createEpic = async (req, res, next) => {
  try {
    const result = await epicsService.create(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const updateEpic = async (req, res, next) => {
  try {
    const result = await epicsService.update(req.params._id, req.body);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getEpics, getEpicById, getStoriesByEpic, createEpic, updateEpic };
