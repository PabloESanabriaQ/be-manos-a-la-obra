import express from 'express';
import { getTasks, getTaskById, createTask, updateTask, deleteTask } from '../controllers/tasks.controller.js';

const router = express.Router();

router.get('/', (req, res, next) => getTasks(req, res, next));
router.get('/:_id', (req, res, next) => getTaskById(req, res, next));
router.post('/', (req, res, next) => createTask(req, res, next));
router.put('/:_id', (req, res, next) => updateTask(req, res, next));
router.patch('/:_id', (req, res, next) => updateTask(req, res, next));
router.delete('/:_id', (req, res, next) => deleteTask(req, res, next));

export default router;
