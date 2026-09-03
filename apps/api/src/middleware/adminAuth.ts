import type { NextFunction, Request, Response } from 'express';
import type { Env } from '../config/env';
import { UnauthorizedError } from '../domain/errors';

const HEADER = 'x-admin-token';

/** Protects the manual sync trigger (§4 "endpoint admin protegido"). */
export function requireAdminToken(env: Env) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = req.header(HEADER);
    if (!token || token !== env.ADMIN_SYNC_TOKEN) {
      throw new UnauthorizedError('Unauthorized');
    }
    next();
  };
}
