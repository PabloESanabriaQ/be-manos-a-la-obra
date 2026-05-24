import ValidationError from '../errors/ValidationError.js';

const validateCreateProject = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
};

const validateUpdateProject = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
};

export { validateCreateProject, validateUpdateProject };
