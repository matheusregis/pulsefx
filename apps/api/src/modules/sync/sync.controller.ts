import type { Request, Response } from 'express';
import type { SyncService } from './sync.service';

export class SyncController {
  constructor(private readonly service: SyncService) {}

  trigger = async (_req: Request, res: Response): Promise<void> => {
    const results = await this.service.syncAll();
    const hasFailures = results.some((r) => !r.ok);
    res.status(hasFailures ? 207 : 200).json({ data: results });
  };
}
