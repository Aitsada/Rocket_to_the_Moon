import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { leaderboard } from './userController.js';

export const userRoutes = Router();

userRoutes.get('/leaderboard', authenticate, leaderboard);
