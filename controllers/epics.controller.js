import * as epicsService from '../services/epics.service.js';

const getEpics = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { data, total } = await epicsService.getAll(page, limit);
    res.status(200).json({ data, pagination: { page, limit, total } });
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

export { getEpics, getEpicById, getStoriesByEpic, createEpic, updateEpic };
