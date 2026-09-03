import 'express-async-errors'; // side-effect import: safe/idempotent to import from every consumer of this module
import type { NextFunction, Request, Response } from 'express';
import type { Logger } from 'pino';
import { HttpError } from '../domain/errors';

/** Terminal handler for requests that matched no route. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
}

/**
 * Single place every thrown error resolves to an HTTP response, so
 * controllers/services just `throw` a typed error (see domain/errors.ts)
 * instead of each picking their own status/res.json shape.
 *
 * - `HttpError` (BadRequest/Unauthorized/NotFound/...): use its own status.
 * - Malformed JSON body (express.json() throws a SyntaxError with `.status`
 *   or `.statusCode` set to 400) and other framework 4xx errors: pass their
 *   status through instead of flattening everything to 500.
 * - Anything else is a genuine bug: log it and return a generic 500 (never
 *   leak internals in the response body).
 */
export function errorHandler(logger: Logger) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof HttpError) {
      if (err.status >= 500) logger.error({ err, path: req.path }, 'server error');
      res.status(err.status).json({ error: err.message });
      return;
    }

    const frameworkStatus = getFrameworkStatus(err);
    if (frameworkStatus !== undefined && frameworkStatus >= 400 && frameworkStatus < 500) {
      res.status(frameworkStatus).json({ error: 'Invalid request' });
      return;
    }

    logger.error({ err, path: req.path }, 'unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  };
}

function getFrameworkStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  const candidate = err as { status?: unknown; statusCode?: unknown };
  const status = candidate.status ?? candidate.statusCode;
  return typeof status === 'number' ? status : undefined;
}
