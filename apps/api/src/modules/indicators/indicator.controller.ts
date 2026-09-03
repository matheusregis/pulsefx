import type { Request, Response } from 'express';
import { IndicatorService } from './indicator.service';

export class IndicatorController {
  constructor(private readonly service: IndicatorService = new IndicatorService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.service.listCards();
    res.json({ data });
  };

  detail = async (req: Request, res: Response): Promise<void> => {
    const detail = await this.service.getDetail(req.params.code);
    if (!detail) {
      res.status(404).json({ error: `Indicator '${req.params.code}' not found` });
      return;
    }
    res.json({ data: detail });
  };
}
