import Epic from '../models/epics.model.js';
import Story from '../models/stories.model.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';
import { validateCreateEpic, validateUpdateEpic } from '../utils/validateEpics.js';

const getAll = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Epic.find().skip(skip).limit(limit),
    Epic.countDocuments(),
  ]);
  return { data, total };
};

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

const create = (body) => {
  validateCreateEpic(body);
  return new Epic(body).save();
};

const update = async (id, body) => {
  validateUpdateEpic(body);
  const epic = await Epic.findById(id);
  if (!epic) throw new NotFoundError('Epic not found');
  if (body.project && epic.project.toString() !== body.project.toString()) {
    throw new ValidationError('Cannot change the project of an epic');
  }
  return Epic.findByIdAndUpdate(id, body, { new: true });
};

export { getAll, getById, getStoriesByEpic, create, update };
