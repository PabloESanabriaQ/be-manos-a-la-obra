import ValidationError from '../errors/ValidationError.js';

const VALID_STATUSES = ['todo', 'running', 'done'];

const validateCreateTask = (task) => {
  if (!task.name) throw new ValidationError('Title is required');
  if (!task.story) throw new ValidationError('The task must be associated with a story');
  if (task.status !== undefined && !VALID_STATUSES.includes(task.status)) {
    throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
};

const validateUpdateTask = (task) => {
  if (!task._id) throw new ValidationError('Task ID is required');
  if (!task.name) throw new ValidationError('Title is required');
  if (!task.story) throw new ValidationError('The task must be associated with a story');
  if (task.status !== undefined && !VALID_STATUSES.includes(task.status)) {
    throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
};

export { validateCreateTask, validateUpdateTask };
