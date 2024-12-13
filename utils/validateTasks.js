const ValidationError = require('../errors/ValidationError');

const validateCreateTask = (task) => {
  if (!task.name) {
    throw new ValidationError('Title is required');
  }
  if (!task.story) {
    throw new ValidationError('The task must be associated with a story');
  }
}

const validateUpdateTask = (task) => {
  if(!task._id) {
    throw new ValidationError('Task ID is required');
  }
  if (!task.name) {
    throw new ValidationError('Title is required');
  }
  if (!task.story) {
    throw new ValidationError('The task must be associated with a story');
  }
}

module.exports = {
  validateCreateTask,
  validateUpdateTask
};
