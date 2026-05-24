import express from 'express';
import { getStories, getStoryById, getTasksByStory, createStory, updateStory } from '../controllers/stories.controller.js';

const router = express.Router();

router.get('/', (req, res, next) => getStories(req, res, next));
router.get('/:_id', (req, res, next) => getStoryById(req, res, next));
router.get('/:_id/tasks', (req, res, next) => getTasksByStory(req, res, next));
router.post('/', (req, res, next) => createStory(req, res, next));
router.put('/:_id', (req, res, next) => updateStory(req, res, next));

export default router;
