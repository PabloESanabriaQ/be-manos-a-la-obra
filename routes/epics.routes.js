import express from 'express';
import { getEpics, getEpicById, getStoriesByEpic, createEpic, updateEpic } from '../controllers/epics.controller.js';

const router = express.Router();

router.get('/', (req, res, next) => getEpics(req, res, next));
router.get('/:_id', (req, res, next) => getEpicById(req, res, next));
router.get('/:_id/stories', (req, res, next) => getStoriesByEpic(req, res, next));
router.post('/', (req, res, next) => createEpic(req, res, next));
router.put('/:_id', (req, res, next) => updateEpic(req, res, next));

export default router;
