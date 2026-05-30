import ValidationError from '../errors/ValidationError.js';

const VALID_STATUSES = ['todo', 'running', 'done'];
const VALID_POINTS = [0, 1, 2, 3, 5, 8, 13, 21];

const validateCreateStory = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
  if (!body.epic) throw new ValidationError('Story must be associated with an epic');
  if (body.points !== undefined && !VALID_POINTS.includes(body.points)) {
    throw new ValidationError(`Points must be one of: ${VALID_POINTS.join(', ')}`);
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
};

const validateUpdateStory = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
  if (body.points !== undefined && !VALID_POINTS.includes(body.points)) {
    throw new ValidationError(`Points must be one of: ${VALID_POINTS.join(', ')}`);
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
};

export { validateCreateStory, validateUpdateStory };
