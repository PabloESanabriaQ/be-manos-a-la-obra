import express from 'express';
import { login } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/', (req, res, next) => login(req, res, next));

export default router;
