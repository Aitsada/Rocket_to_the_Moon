import { Router } from 'express';
import { leaderboard } from './user.controller.js';

export const userRoutes = Router();

userRoutes.get('/leaderboard', leaderboard);
