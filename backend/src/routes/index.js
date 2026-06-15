import { Router } from 'express';
import { authRoutes } from '../features/auth/authRoutes.js';
import { gameRoutes } from '../features/game/gameRoutes.js';
import { userRoutes } from '../features/users/userRoutes.js';

export const apiRoutes = Router();

apiRoutes.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/game', gameRoutes);
apiRoutes.use('/users', userRoutes);
