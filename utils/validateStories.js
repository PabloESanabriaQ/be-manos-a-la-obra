import ValidationError from '../errors/ValidationError.js';

const VALID_STATUSES = ['todo', 'running', 'done'];

const validateCreateStory = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
  if (!body.epic) throw new ValidationError('Story must be associated with an epic');
  if (body.points !== undefined && (body.points < 0 || body.points > 5)) {
    throw new ValidationError('Points must be between 0 and 5');
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
};

const validateUpdateStory = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
  if (body.points !== undefined && (body.points < 0 || body.points > 5)) {
    throw new ValidationError('Points must be between 0 and 5');
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
};

export { validateCreateStory, validateUpdateStory };
