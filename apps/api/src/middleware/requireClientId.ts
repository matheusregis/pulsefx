import type { NextFunction, Request, Response } from 'express';
import { BadRequestError } from '../domain/errors';

const HEADER = 'x-client-id';

/**
 * Favorites have no user accounts (out of scope, §8), so the frontend
 * generates a random id once and persists it in localStorage, sending it
 * on every favorites call. Reject requests missing it rather than silently
 * bucketing them under a shared key.
 */
export function requireClientId(req: Request, _res: Response, next: NextFunction): void {
  const clientId = req.header(HEADER);
  if (!clientId || clientId.trim().length === 0) {
    throw new BadRequestError(`Missing required '${HEADER}' header`);
  }
  req.clientId = clientId;
  next();
}
