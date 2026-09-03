import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/db/prisma';

export interface ObservationInput {
  date: Date;
  value: number;
}

/**
 * Data-access layer for indicators/observations. Keeps Prisma specifics
 * (upsert keys, transactions) out of the service layer.
 */
export class IndicatorRepository {
  findAll() {
    return prisma.indicator.findMany({ orderBy: { code: 'asc' } });
  }

  findByCode(code: string) {
    return prisma.indicator.findUnique({ where: { code } });
  }

  findObservations(indicatorId: string, limit: number) {
    return prisma.observation.findMany({
      where: { indicatorId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  /** Idempotent bulk upsert keyed on (indicatorId, date) so re-sync never duplicates rows. */
  async upsertObservations(indicatorId: string, points: ObservationInput[]): Promise<number> {
    if (points.length === 0) return 0;
    await prisma.$transaction(
      points.map((p) =>
        prisma.observation.upsert({
          where: { indicatorId_date: { indicatorId, date: p.date } },
          create: { indicatorId, date: p.date, value: new Prisma.Decimal(p.value) },
          update: { value: new Prisma.Decimal(p.value) },
        }),
      ),
    );
    return points.length;
  }

  async markSynced(indicatorId: string, at: Date) {
    await prisma.indicator.update({ where: { id: indicatorId }, data: { lastSyncedAt: at } });
  }
}
