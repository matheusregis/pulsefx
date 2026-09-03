import { Router } from 'express';
import { requireClientId } from '../../middleware/requireClientId';
import { FavoriteController } from './favorite.controller';

export function favoriteRoutes(): Router {
  const router = Router();
  const controller = new FavoriteController();

  router.use(requireClientId);
  router.get('/', controller.list);
  router.put('/:code', controller.add);
  router.delete('/:code', controller.remove);

  return router;
}
