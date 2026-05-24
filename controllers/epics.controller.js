const Epic = require('../models/epics.model');
const Story = require('../models/stories.model');
//TODO: Crear las validaciones para la creación y actualización de epics:
//const { validateCreateEpic, validateUpdateEpic } = require('../utils/validateEpic');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

const getEpics = (req, res, next) => {
  Epic.find()
  .then((result) => {
    res.status(200).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
}

const getEpicById = (req, res, next) => {
  Epic.findById(req.params._id)
  .then((result) => {
    if (!result) {
        const err = new NotFoundError('Epic not found');
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

const getStoriesByEpic = async (req, res, next) => {
  try {
    const epic = await Epic.findById(req.params._id);
    if (!epic) {
      throw new NotFoundError('Epic not found');
    }
    const result = await Story.find({ epic: req.params._id });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

const createEpic = (req, res, next) => {
  //validateCreateEpic(req.body);
  const epic = new Epic(req.body);
  epic.save()
  .then((result) => {
    res.status(201).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
}

const updateEpic = async (req, res, next) => {
  //validateUpdateEpic(req.body);
  try {
    const epic = await Epic.findById(req.params._id);
    if (!epic) {
      throw new NotFoundError('Epic not found');
    }
    if (req.body.project && epic.project.toString() !== req.body.project.toString()) {
      throw new ValidationError('Cannot change the project of an epic');
    }
    const result = await Epic.findByIdAndUpdate(req.params._id, req.body, { new: true });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEpics,
  getEpicById,
  getStoriesByEpic,
  createEpic,
  updateEpic
}
