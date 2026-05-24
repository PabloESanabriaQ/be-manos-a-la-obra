import express from 'express';
import { getUsers, getUserById } from '../controllers/users.controller.js';
import { register } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/', (req, res, next) => getUsers(req, res, next));
router.get('/:_id', (req, res, next) => getUserById(req, res, next));
router.post('/', (req, res, next) => register(req, res, next));

export default router;
