const Epic = require('../models/epics.model');
const Story = require('../models/stories.model');
//TODO: Crear las validaciones para la creación y actualización de epics:
//const { validateCreateEpic, validateUpdateEpic } = require('../utils/validateEpic');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

const getEpics = (req, res) => {
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

const getStoriesByEpic = (req, res, next) => {
  const epic = Epic.findById(req.params._id);
  if (!epic) {
    const err = new NotFoundError('Epic not found');
    err.status = 404;
    throw err;
  }
  Story.find({story: req.params._id})
  .then((result) => {
    res.status(200).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
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

const updateEpic = (req, res, next) => {
  //validateUpdateEpic(req.body);
  const epic = Epic.findById(req.params._id);
  const newEpic = new Epic(req.body);
  if(epic.project !== newEpic.project) {
    throw new ValidationError('Cannot change the project of an epic');
  }
  
  Epic.findByIdAndUpdate(req.params._id, newEpic, {new: true});
}

module.exports = {
  getEpics,
  getEpicById,
  getStoriesByEpic,
  createEpic,
  updateEpic
}
