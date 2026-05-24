import express from 'express';
import { getMe, getUsers, getUserById } from '../controllers/users.controller.js';
import { register } from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/authentication.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Usuarios
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar usuarios
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Registrar usuario
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, email]
 *             properties:
 *               username:
 *                 type: string
 *                 example: pablo
 *               password:
 *                 type: string
 *                 example: "secreto123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: pablo@example.com
 *     responses:
 *       201:
 *         description: Usuario creado. Setea la cookie `token`.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario creado
 *       409:
 *         description: El nombre de usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authMiddleware, (req, res, next) => getMe(req, res, next));
router.get('/', (req, res, next) => getUsers(req, res, next));
router.post('/', (req, res, next) => register(req, res, next));

/**
 * @swagger
 * /users/{_id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:_id', (req, res, next) => getUserById(req, res, next));

export default router;
