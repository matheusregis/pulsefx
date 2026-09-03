import type { Request, Response } from 'express';
import { FavoriteService } from './favorite.service';

export class FavoriteController {
  constructor(private readonly service: FavoriteService = new FavoriteService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const codes = await this.service.list(req.clientId!);
    res.json({ data: codes });
  };

  add = async (req: Request, res: Response): Promise<void> => {
    await this.service.add(req.clientId!, req.params.code);
    res.status(204).send();
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.service.remove(req.clientId!, req.params.code);
    res.status(204).send();
  };
}
