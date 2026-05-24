import Epic from '../models/epics.model.js';
import Story from '../models/stories.model.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';

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

export { getAll, getById, getStoriesByEpic, create, update };
