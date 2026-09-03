import express from 'express';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { NotFoundError } from '../../domain/errors';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler';
import { indicatorRoutes } from './indicator.routes';
import type { IndicatorService } from './indicator.service';
import type { IndicatorCardDTO, IndicatorDetailDTO } from './indicator.dto';

const card: IndicatorCardDTO = {
  code: 'USD-BRL-PTAX',
  name: 'Dólar (PTAX venda)',
  source: 'BCB',
  unit: 'BRL por USD',
  frequency: 'DAILY',
  variationLabel: 'D/D-1',
  lastSyncedAt: '2024-01-12T10:00:00.000Z',
  valueLabel: 'Venda',
  latestValue: 5.2,
  secondaryValueLabel: 'Compra',
  latestSecondaryValue: 5.18,
  referenceDate: '2024-01-12',
  variationPercent: 1.5,
  variationUnavailableReason: null,
};

// Mirrors app.ts's wiring (routes + 404 + error handler) so these tests
// exercise the same error-mapping path the real server uses.
function buildApp(service: Partial<IndicatorService>) {
  const app = express();
  app.use(express.json());
  app.use('/api/indicators', indicatorRoutes(service as IndicatorService));
  app.use(notFoundHandler);
  app.use(errorHandler(pino({ level: 'silent' })));
  return app;
}

describe('GET /api/indicators', () => {
  it('returns the list of indicator cards', async () => {
    const app = buildApp({ listCards: async () => [card] });

    const res = await request(app).get('/api/indicators');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [card] });
  });
});

describe('GET /api/indicators/:code', () => {
  it('returns 200 with the indicator detail when found', async () => {
    const detail: IndicatorDetailDTO = {
      ...card,
      description: 'desc',
      limitations: 'limits',
      historyWindow: 90,
      history: [{ date: '2024-01-12', value: 5.2 }],
    };
    const app = buildApp({ getDetail: async () => detail });

    const res = await request(app).get('/api/indicators/USD-BRL-PTAX');

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe('USD-BRL-PTAX');
    expect(res.body.data.history).toHaveLength(1);
  });

  it('returns 404 when the indicator does not exist', async () => {
    const app = buildApp({
      getDetail: async () => {
        throw new NotFoundError("Indicator 'DOES-NOT-EXIST' not found");
      },
    });

    const res = await request(app).get('/api/indicators/DOES-NOT-EXIST');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('unmatched routes', () => {
  it('returns 404 for a path with no matching route', async () => {
    const app = buildApp({});

    const res = await request(app).get('/api/indicators/USD-BRL-PTAX/nope');

    expect(res.status).toBe(404);
  });
});
