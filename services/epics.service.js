const Epic = require('../models/epics.model');
const Story = require('../models/stories.model');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

const getAll = () => Epic.find();

const getById = async (id) => {
  const epic = await Epic.findById(id);
  if (!epic) throw new NotFoundError('Epic not found');
  return epic;
};

const getStoriesByEpic = async (id) => {
  const epic = await Epic.findById(id);
  if (!epic) throw new NotFoundError('Epic not found');
  return Story.find({ epic: id });
};

const create = (body) => new Epic(body).save();

const update = async (id, body) => {
  const epic = await Epic.findById(id);
  if (!epic) throw new NotFoundError('Epic not found');
  if (body.project && epic.project.toString() !== body.project.toString()) {
    throw new ValidationError('Cannot change the project of an epic');
  }
  return Epic.findByIdAndUpdate(id, body, { new: true });
};

module.exports = { getAll, getById, getStoriesByEpic, create, update };
