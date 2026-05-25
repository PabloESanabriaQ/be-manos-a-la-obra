import express from 'express';
import { getStories, getStoryById, getTasksByStory, createStory, updateStory, deleteStory } from '../controllers/stories.controller.js';
import resolveProjectId from '../middlewares/resolveProjectId.js';
import requireProjectAccess from '../middlewares/requireProjectAccess.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Stories
 *   description: Historias de usuario
 */

/**
 * @swagger
 * /stories:
 *   get:
 *     summary: Listar historias
 *     tags: [Stories]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Lista paginada de historias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Story'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Crear historia
 *     tags: [Stories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoryInput'
 *     responses:
 *       201:
 *         description: Historia creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Story'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req, res, next) => getStories(req, res, next));
router.post('/', resolveProjectId('story'), requireProjectAccess('story', 'create'), (req, res, next) => createStory(req, res, next));

/**
 * @swagger
 * /stories/{_id}:
 *   get:
 *     summary: Obtener historia por ID
 *     tags: [Stories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Historia encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Story'
 *       404:
 *         description: Historia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Actualizar historia
 *     tags: [Stories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoryInput'
 *     responses:
 *       200:
 *         description: Historia actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Story'
 *       400:
 *         description: Datos inválidos (ej. intento de cambiar la épica)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Historia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:_id', resolveProjectId('story'), requireProjectAccess('story', 'read'), (req, res, next) => getStoryById(req, res, next));
router.put('/:_id', resolveProjectId('story'), requireProjectAccess('story', 'edit'), (req, res, next) => updateStory(req, res, next));
router.delete('/:_id', resolveProjectId('story'), requireProjectAccess('story', 'delete'), (req, res, next) => deleteStory(req, res, next));

/**
 * @swagger
 * /stories/{_id}/tasks:
 *   get:
 *     summary: Obtener tareas de una historia
 *     tags: [Stories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Lista de tareas de la historia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       404:
 *         description: Historia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:_id/tasks', resolveProjectId('story'), requireProjectAccess('task', 'read'), (req, res, next) => getTasksByStory(req, res, next));

export default router;
