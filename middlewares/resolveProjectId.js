import Epic from '../models/epics.model.js';
import Story from '../models/stories.model.js';
import Task from '../models/tasks.model.js';
import NotFoundError from '../errors/NotFoundError.js';

const fromEpic = async (req) => {
  if (req.params._id) {
    const epic = await Epic.findById(req.params._id).select('project deletedAt');
    if (!epic || epic.deletedAt) throw new NotFoundError('Epic not found');
    return epic.project;
  }
  return req.body.project;
};

const fromStory = async (req) => {
  if (req.params._id) {
    const story = await Story.findById(req.params._id)
      .populate({ path: 'epic', select: 'project deletedAt' });
    if (!story || story.deletedAt) throw new NotFoundError('Story not found');
    if (!story.epic || story.epic.deletedAt) throw new NotFoundError('Epic not found');
    return story.epic.project;
  }
  const epic = await Epic.findById(req.body.epic).select('project deletedAt');
  if (!epic || epic.deletedAt) throw new NotFoundError('Epic not found');
  return epic.project;
};

const fromTask = async (req) => {
  if (req.params._id) {
    const task = await Task.findById(req.params._id)
      .populate({ path: 'story', populate: { path: 'epic', select: 'project deletedAt' } });
    if (!task || task.deletedAt) throw new NotFoundError('Task not found');
    return task.story.epic.project;
  }
  const story = await Story.findById(req.body.story)
    .populate({ path: 'epic', select: 'project deletedAt' });
  if (!story || story.deletedAt) throw new NotFoundError('Story not found');
  return story.epic.project;
};

const resolvers = { epic: fromEpic, story: fromStory, task: fromTask };

const resolveProjectId = (resource) => async (req, res, next) => {
  try {
    req.projectId = await resolvers[resource](req);
    next();
  } catch (err) {
    next(err);
  }
};

export default resolveProjectId;
