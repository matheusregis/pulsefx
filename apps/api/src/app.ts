import cors from 'cors';
import express, { type Express } from 'express';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import type { Env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { favoriteRoutes } from './modules/favorites/favorite.routes';
import { indicatorRoutes } from './modules/indicators/indicator.routes';
import { syncRoutes } from './modules/sync/sync.routes';
import type { SyncService } from './modules/sync/sync.service';

export function createApp(env: Env, logger: Logger, syncService: SyncService): Express {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/indicators', indicatorRoutes());
  app.use('/api/favorites', favoriteRoutes());
  app.use('/api/admin/sync', syncRoutes(env, syncService));

  app.use(notFoundHandler);
  app.use(errorHandler(logger));

  return app;
}
