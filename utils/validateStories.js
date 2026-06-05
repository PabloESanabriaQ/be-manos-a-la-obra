import ValidationError from '../errors/ValidationError.js';

const VALID_STATUSES = ['todo', 'running', 'done'];
const VALID_POINTS = [0, 1, 2, 3, 5, 8, 13, 21];

const validatePoints = (body) => {
  if (body.points === undefined || body.points === null || body.points === '') {
    delete body.points;
    return;
  }
  const n = Number(body.points);
  if (!VALID_POINTS.includes(n)) {
    throw new ValidationError(`Points must be one of: ${VALID_POINTS.join(', ')}`);
  }
  body.points = n;
};

const validateCreateStory = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
  if (!body.epic) throw new ValidationError('Story must be associated with an epic');
  validatePoints(body);
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
};

const validateUpdateStory = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
  validatePoints(body);
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
};

export { validateCreateStory, validateUpdateStory };
