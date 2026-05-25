import express from 'express';
import { getEpics, getEpicById, getStoriesByEpic, createEpic, updateEpic, deleteEpic } from '../controllers/epics.controller.js';
import resolveProjectId from '../middlewares/resolveProjectId.js';
import requireProjectAccess from '../middlewares/requireProjectAccess.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Epics
 *   description: Épicas
 */

/**
 * @swagger
 * /epics:
 *   get:
 *     summary: Listar épicas
 *     tags: [Epics]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Lista paginada de épicas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Epic'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Crear épica
 *     tags: [Epics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EpicInput'
 *     responses:
 *       201:
 *         description: Épica creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Epic'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req, res, next) => getEpics(req, res, next));
router.post('/', resolveProjectId('epic'), requireProjectAccess('epic', 'create'), (req, res, next) => createEpic(req, res, next));

/**
 * @swagger
 * /epics/{_id}:
 *   get:
 *     summary: Obtener épica por ID
 *     tags: [Epics]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Épica encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Epic'
 *       404:
 *         description: Épica no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Actualizar épica
 *     tags: [Epics]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EpicInput'
 *     responses:
 *       200:
 *         description: Épica actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Epic'
 *       400:
 *         description: Datos inválidos (ej. intento de cambiar el proyecto)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Épica no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:_id', resolveProjectId('epic'), requireProjectAccess('epic', 'read'), (req, res, next) => getEpicById(req, res, next));
router.put('/:_id', resolveProjectId('epic'), requireProjectAccess('epic', 'edit'), (req, res, next) => updateEpic(req, res, next));
router.delete('/:_id', resolveProjectId('epic'), requireProjectAccess('epic', 'delete'), (req, res, next) => deleteEpic(req, res, next));

/**
 * @swagger
 * /epics/{_id}/stories:
 *   get:
 *     summary: Obtener historias de una épica
 *     tags: [Epics]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Lista de historias de la épica
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Story'
 *       404:
 *         description: Épica no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:_id/stories', resolveProjectId('epic'), requireProjectAccess('story', 'read'), (req, res, next) => getStoriesByEpic(req, res, next));

export default router;
