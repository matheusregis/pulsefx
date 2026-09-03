import { Router } from 'express';
import type { Env } from '../../config/env';
import { requireAdminToken } from '../../middleware/adminAuth';
import { SyncController } from './sync.controller';
import type { SyncService } from './sync.service';

export function syncRoutes(env: Env, syncService: SyncService): Router {
  const router = Router();
  const controller = new SyncController(syncService);

  router.post('/', requireAdminToken(env), controller.trigger);

  return router;
}
