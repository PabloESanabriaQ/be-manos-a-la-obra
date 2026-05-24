import Story from '../models/stories.model.js';
import Task from '../models/tasks.model.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';
import { validateCreateStory, validateUpdateStory } from '../utils/validateStories.js';

const getAll = () => Story.find();

const getById = async (id) => {
  const story = await Story.findById(id);
  if (!story) throw new NotFoundError('Story not found');
  return story;
};

const getTasksByStory = async (id) => {
  const story = await Story.findById(id);
  if (!story) throw new NotFoundError('Story not found');
  return Task.find({ story: id });
};

const create = (body) => {
  validateCreateStory(body);
  return new Story(body).save();
};

const update = async (id, body) => {
  validateUpdateStory(body);
  const story = await Story.findById(id);
  if (!story) throw new NotFoundError('Story not found');
  if (body.epic && story.epic.toString() !== body.epic.toString()) {
    throw new ValidationError('Cannot change the epic of a story');
  }
  return Story.findByIdAndUpdate(id, body, { new: true });
};

export { getAll, getById, getTasksByStory, create, update };
