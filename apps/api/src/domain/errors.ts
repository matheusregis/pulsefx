/**
 * Typed errors carrying the HTTP status they should map to. Thrown from any
 * layer (service, middleware) and mapped 1:1 by middleware/errorHandler.ts —
 * callers never need their own try/catch just to pick a status code.
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(message, 404);
  }
}
