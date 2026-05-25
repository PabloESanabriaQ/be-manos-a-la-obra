import express from 'express';
import { getProjects, getProjectById, getEpicsByProject, createProject, updateProject, deleteProject, updateProjectMembers } from '../controllers/projects.controller.js';
import requireRole from '../middlewares/requireRole.js';
import requireProjectAccess from '../middlewares/requireProjectAccess.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Proyectos
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Listar proyectos
 *     tags: [Projects]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Lista paginada de proyectos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Crear proyecto
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     responses:
 *       201:
 *         description: Proyecto creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req, res, next) => getProjects(req, res, next));
router.post('/', requireRole('admin_users'), (req, res, next) => createProject(req, res, next));

/**
 * @swagger
 * /projects/{_id}:
 *   get:
 *     summary: Obtener proyecto por ID
 *     tags: [Projects]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Proyecto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Proyecto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Actualizar proyecto
 *     tags: [Projects]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     responses:
 *       200:
 *         description: Proyecto actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Proyecto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Actualizar proyecto (parcial)
 *     tags: [Projects]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     responses:
 *       200:
 *         description: Proyecto actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *   delete:
 *     summary: Eliminar proyecto
 *     tags: [Projects]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Proyecto eliminado
 *       404:
 *         description: Proyecto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:_id', requireProjectAccess('project', 'read'), (req, res, next) => getProjectById(req, res, next));
router.put('/:_id', requireProjectAccess('project', 'edit'), (req, res, next) => updateProject(req, res, next));
router.patch('/:_id', requireProjectAccess('project', 'edit'), (req, res, next) => updateProject(req, res, next));
router.delete('/:_id', requireProjectAccess('project', 'delete'), (req, res, next) => deleteProject(req, res, next));

/**
 * @swagger
 * /projects/{_id}/epics:
 *   get:
 *     summary: Obtener épicas de un proyecto
 *     tags: [Projects]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Lista de épicas del proyecto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Epic'
 *       404:
 *         description: Proyecto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:_id/epics', requireProjectAccess('epic', 'read'), (req, res, next) => getEpicsByProject(req, res, next));
router.put('/:_id/members', requireRole('admin_users'), (req, res, next) => updateProjectMembers(req, res, next));

export default router;
