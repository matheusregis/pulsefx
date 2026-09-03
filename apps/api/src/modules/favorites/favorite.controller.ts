import type { Request, Response } from 'express';
import { NotFoundError } from '../../domain/errors';
import { FavoriteService } from './favorite.service';

export class FavoriteController {
  constructor(private readonly service: FavoriteService = new FavoriteService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const codes = await this.service.list(req.clientId!);
    res.json({ data: codes });
  };

  add = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.add(req.clientId!, req.params.code);
      res.status(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      throw err;
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.remove(req.clientId!, req.params.code);
      res.status(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      throw err;
    }
  };
}
