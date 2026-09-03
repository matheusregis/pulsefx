import { Router } from 'express';
import { requireClientId } from '../../middleware/requireClientId';
import { FavoriteController } from './favorite.controller';
import type { FavoriteService } from './favorite.service';

export function favoriteRoutes(service?: FavoriteService): Router {
  const router = Router();
  const controller = new FavoriteController(service);

  router.use(requireClientId);
  router.get('/', controller.list);
  router.put('/:code', controller.add);
  router.delete('/:code', controller.remove);

  return router;
}
