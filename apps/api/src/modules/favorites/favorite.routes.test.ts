import express from 'express';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { NotFoundError } from '../../domain/errors';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler';
import { favoriteRoutes } from './favorite.routes';
import type { FavoriteService } from './favorite.service';

function buildApp(service: Partial<FavoriteService>) {
  const app = express();
  app.use(express.json());
  app.use('/api/favorites', favoriteRoutes(service as FavoriteService));
  app.use(notFoundHandler);
  app.use(errorHandler(pino({ level: 'silent' })));
  return app;
}

describe('favorites — X-Client-Id enforcement', () => {
  it('returns 400 (not a crash) when X-Client-Id is missing', async () => {
    const app = buildApp({});

    const res = await request(app).get('/api/favorites');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/x-client-id/i);
  });
});

describe('GET /api/favorites', () => {
  it('returns the favorited codes for the given client', async () => {
    const app = buildApp({ list: async () => ['USD-BRL-PTAX'] });

    const res = await request(app).get('/api/favorites').set('X-Client-Id', 'client-1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: ['USD-BRL-PTAX'] });
  });
});

describe('PUT /api/favorites/:code', () => {
  it('returns 204 on success', async () => {
    const app = buildApp({ add: async () => undefined });

    const res = await request(app).put('/api/favorites/USD-BRL-PTAX').set('X-Client-Id', 'client-1');

    expect(res.status).toBe(204);
  });

  it('returns 404 (not 500) when the indicator code does not exist', async () => {
    const app = buildApp({
      add: async () => {
        throw new NotFoundError("Indicator 'NOPE' not found");
      },
    });

    const res = await request(app).put('/api/favorites/NOPE').set('X-Client-Id', 'client-1');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('DELETE /api/favorites/:code', () => {
  it('returns 204 on success', async () => {
    const app = buildApp({ remove: async () => undefined });

    const res = await request(app).delete('/api/favorites/USD-BRL-PTAX').set('X-Client-Id', 'client-1');

    expect(res.status).toBe(204);
  });
});
