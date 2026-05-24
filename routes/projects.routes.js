import express from 'express';
import { getProjects, getProjectById, getEpicsByProject, createProject, updateProject, deleteProject } from '../controllers/projects.controller.js';

const router = express.Router();

router.get('/', (req, res, next) => getProjects(req, res, next));
router.get('/:_id', (req, res, next) => getProjectById(req, res, next));
router.get('/:_id/epics', (req, res, next) => getEpicsByProject(req, res, next));
router.post('/', (req, res, next) => createProject(req, res, next));
router.put('/:_id', (req, res, next) => updateProject(req, res, next));
router.patch('/:_id', (req, res, next) => updateProject(req, res, next));
router.delete('/:_id', (req, res, next) => deleteProject(req, res, next));

export default router;
