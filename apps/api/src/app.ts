import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import type { Env } from './config/env';
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

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  // Centralized error handler — keeps try/catch out of every controller.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err, path: req.path }, 'unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
