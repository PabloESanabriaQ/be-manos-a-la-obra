import express from 'express';
import rateLimit from 'express-rate-limit';
import { login } from '../controllers/auth.controller.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: true, message: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

router.post('/', loginLimiter, (req, res, next) => login(req, res, next));

export default router;
