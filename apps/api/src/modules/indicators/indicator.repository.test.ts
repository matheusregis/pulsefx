import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock factories are hoisted above imports/const declarations, so the
// mock object itself must be created via vi.hoisted to avoid a TDZ error.
const prismaMock = vi.hoisted(() => ({
  indicator: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  observation: { findMany: vi.fn(), upsert: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('../../infra/db/prisma', () => ({ prisma: prismaMock }));

// Imported after the mock so the module under test picks up the mocked prisma.
import { IndicatorRepository } from './indicator.repository';

describe('IndicatorRepository', () => {
  let repo: IndicatorRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new IndicatorRepository();
  });

  it('findObservations orders by date desc and applies the given limit', async () => {
    prismaMock.observation.findMany.mockResolvedValue([]);

    await repo.findObservations('ind-1', 5);

    expect(prismaMock.observation.findMany).toHaveBeenCalledWith({
      where: { indicatorId: 'ind-1' },
      orderBy: { date: 'desc' },
      take: 5,
    });
  });

  it('upsertObservations upserts each point keyed on (indicatorId, date) inside one transaction', async () => {
    prismaMock.$transaction.mockResolvedValue(undefined);

    const count = await repo.upsertObservations('ind-1', [
      { date: new Date('2024-01-12T00:00:00.000Z'), value: 5.2 },
      { date: new Date('2024-01-11T00:00:00.000Z'), value: 5.1 },
    ]);

    expect(count).toBe(2);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    const batchedOps = prismaMock.$transaction.mock.calls[0][0];
    expect(batchedOps).toHaveLength(2);
    expect(prismaMock.observation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { indicatorId_date: { indicatorId: 'ind-1', date: new Date('2024-01-12T00:00:00.000Z') } },
      }),
    );
  });

  it('upsertObservations is a no-op (no transaction) for an empty batch', async () => {
    const count = await repo.upsertObservations('ind-1', []);

    expect(count).toBe(0);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('markSynced stamps lastSyncedAt on the indicator', async () => {
    const at = new Date('2024-01-12T10:00:00.000Z');

    await repo.markSynced('ind-1', at);

    expect(prismaMock.indicator.update).toHaveBeenCalledWith({
      where: { id: 'ind-1' },
      data: { lastSyncedAt: at },
    });
  });
});
