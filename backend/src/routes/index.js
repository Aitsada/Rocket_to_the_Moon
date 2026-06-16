import { Router } from 'express';
import { authRoutes } from '../features/auth/auth.route.js';
import { gameRoutes } from '../features/game/game.route.js';
import { userRoutes } from '../features/users/user.route.js';

export const apiRoutes = Router();

apiRoutes.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
// /api
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/game', gameRoutes);
apiRoutes.use('/users', userRoutes);
