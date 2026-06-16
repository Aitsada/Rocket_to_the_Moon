import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { leaderboard } from './user.controller.js';

export const userRoutes = Router();

userRoutes.get('/leaderboard', authenticate, leaderboard);
