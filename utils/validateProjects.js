import ValidationError from '../errors/ValidationError.js';

const validateCreateProject = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
  if (!body.adminId) throw new ValidationError('adminId is required');
};

const validateUpdateProject = (body) => {
  if (!body.name) throw new ValidationError('Name is required');
};

export { validateCreateProject, validateUpdateProject };
