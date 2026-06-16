import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { login, me, register } from './auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/me', authenticate, me);
