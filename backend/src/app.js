import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiRoutes } from './routes/index.js';

export const app = express();

app.use(cors({
  origin: env.clientOrigin,
  credentials: true
}));
app.use(express.json({ limit: '32kb' }));

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);
