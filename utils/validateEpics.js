import ValidationError from '../errors/ValidationError.js';

const validateCreateEpic = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
  if (!body.project) throw new ValidationError('Epic must be associated with a project');
};

const validateUpdateEpic = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
};

export { validateCreateEpic, validateUpdateEpic };
