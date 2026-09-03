import { Router } from 'express';
import { IndicatorController } from './indicator.controller';
import type { IndicatorService } from './indicator.service';

export function indicatorRoutes(service?: IndicatorService): Router {
  const router = Router();
  const controller = new IndicatorController(service);

  router.get('/', controller.list);
  router.get('/:code', controller.detail);

  return router;
}
