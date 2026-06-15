import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { cashOut, crashRound, history, startRound } from './gameController.js';

export const gameRoutes = Router();

gameRoutes.post('/start', optionalAuth, startRound);
gameRoutes.post('/cashout', optionalAuth, cashOut);
gameRoutes.post('/crash', optionalAuth, crashRound);
gameRoutes.get('/history', authenticate, history);
