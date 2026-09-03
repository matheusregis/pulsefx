import pino from 'pino';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Integration test: SyncService + IndicatorService against a real Postgres
 * (via Prisma), exercising actual upserts/queries end-to-end. The upstream
 * HTTP boundary (BCB/FRED) is stubbed for determinism/CI reproducibility —
 * everything on our side of that boundary (DB, transactions, DTO mapping,
 * variation calc) is real.
 *
 * Requires: DATABASE_URL pointing at a reachable Postgres with migrations
 * applied. See README § Testes: `docker compose up -d postgres && npm run
 * prisma:migrate --workspace apps/api && npm run test:integration --workspace apps/api`.
 */
vi.mock('../../infra/http/bcbClient', () => ({
  fetchPtaxSeries: vi.fn(async () => [
    { date: '2024-01-10', value: 4.9 },
    { date: '2024-01-11', value: 5.0 },
    { date: '2024-01-12', value: 5.2 },
  ]),
  fetchSgsSeries: vi.fn(async () => []),
}));
vi.mock('../../infra/http/fredClient', () => ({
  fetchFredObservations: vi.fn(async () => []),
}));

import { prisma } from '../../infra/db/prisma';
import { IndicatorService } from '../indicators/indicator.service';
import { loadEnv } from '../../config/env';
import { SyncService } from './sync.service';

const TEST_CODE = 'TEST-USD-BRL-PTAX';
const silentLogger = pino({ level: 'silent' });

describe('SyncService + IndicatorService (integration, real Postgres)', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.observation.deleteMany({ where: { indicator: { code: TEST_CODE } } });
    await prisma.indicator.deleteMany({ where: { code: TEST_CODE } });
    await prisma.indicator.create({
      data: {
        code: TEST_CODE,
        name: 'Test PTAX',
        source: 'BCB',
        sourceSeriesId: 'PTAX',
        unit: 'BRL por USD',
        frequency: 'DAILY',
        variationWindow: 1,
        variationLabel: 'D/D-1',
        historyWindow: 30,
        description: 'test',
        limitations: 'test',
      },
    });
  });

  afterAll(async () => {
    await prisma.observation.deleteMany({ where: { indicator: { code: TEST_CODE } } });
    await prisma.indicator.deleteMany({ where: { code: TEST_CODE } });
    await prisma.$disconnect();
  });

  it('persists synced observations and computes variation from what is actually in Postgres', async () => {
    const env = loadEnv({ ...process.env, FRED_API_KEY: 'test-key', ADMIN_SYNC_TOKEN: 'x'.repeat(8) });
    const syncService = new SyncService(env, silentLogger);

    const results = await syncService.syncAll();
    const ptaxResult = results.find((r) => r.code === TEST_CODE);
    expect(ptaxResult?.ok).toBe(true);
    expect(ptaxResult?.upserted).toBe(3);

    const stored = await prisma.observation.findMany({
      where: { indicator: { code: TEST_CODE } },
      orderBy: { date: 'desc' },
    });
    expect(stored).toHaveLength(3);
    expect(Number(stored[0].value)).toBe(5.2);

    const indicatorService = new IndicatorService();
    const detail = await indicatorService.getDetail(TEST_CODE);

    expect(detail?.latestValue).toBe(5.2);
    expect(detail?.referenceDate).toBe('2024-01-12');
    expect(detail?.variationPercent).toBeCloseTo(4, 5); // (5.2-5.0)/5.0 * 100
    expect(detail?.history.map((p) => p.date)).toEqual(['2024-01-10', '2024-01-11', '2024-01-12']);
  });

  it('re-running sync is idempotent (upsert, not duplicate rows)', async () => {
    const env = loadEnv({ ...process.env, FRED_API_KEY: 'test-key', ADMIN_SYNC_TOKEN: 'x'.repeat(8) });
    const syncService = new SyncService(env, silentLogger);

    await syncService.syncAll();
    await syncService.syncAll();

    const stored = await prisma.observation.findMany({ where: { indicator: { code: TEST_CODE } } });
    expect(stored).toHaveLength(3);
  });
});
