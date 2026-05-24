const Story = require('../models/stories.model');
const Task = require('../models/tasks.model');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

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

const create = (body) => new Story(body).save();

const update = async (id, body) => {
  const story = await Story.findById(id);
  if (!story) throw new NotFoundError('Story not found');
  if (body.epic && story.epic.toString() !== body.epic.toString()) {
    throw new ValidationError('Cannot change the epic of a story');
  }
  return Story.findByIdAndUpdate(id, body, { new: true });
};

module.exports = { getAll, getById, getTasksByStory, create, update };
