import type { Indicator } from '@prisma/client';
import type { Logger } from 'pino';
import type { Env } from '../../config/env';
import { fetchPtaxSeries, fetchSgsSeries, type RawPoint } from '../../infra/http/bcbClient';
import { fetchFredObservations } from '../../infra/http/fredClient';
import { IndicatorRepository } from '../indicators/indicator.repository';

export interface SyncResult {
  code: string;
  ok: boolean;
  upserted?: number;
  error?: string;
}

/** How far back to request from upstream, per frequency — generous buffers
 * so weekends/holidays/COPOM gaps never leave fewer than `historyWindow`
 * usable points. */
function lookbackDays(indicator: Pick<Indicator, 'frequency' | 'historyWindow'>): number {
  return indicator.frequency === 'DAILY' ? indicator.historyWindow * 3 : indicator.historyWindow * 32;
}

function dateOnly(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/**
 * Pulls fresh observations from BCB/FRED and upserts them. This is the
 * *only* place external APIs are called — dashboard/detail reads always
 * come from Postgres (see §4 "Sincronização").
 */
export class SyncService {
  constructor(
    private readonly env: Env,
    private readonly logger: Logger,
    private readonly repo: IndicatorRepository = new IndicatorRepository(),
  ) {}

  async syncAll(): Promise<SyncResult[]> {
    const indicators = await this.repo.findAll();
    const results: SyncResult[] = [];
    for (const indicator of indicators) {
      // Sequential on purpose: BCB/FRED are public APIs without a documented
      // concurrency budget — one indicator at a time keeps us well under it.
      results.push(await this.syncOne(indicator));
    }
    return results;
  }

  private async syncOne(indicator: Indicator): Promise<SyncResult> {
    try {
      const points = await this.fetchRaw(indicator);
      const upserted = await this.repo.upsertObservations(
        indicator.id,
        points.map((p) => ({ date: dateOnly(p.date), value: p.value })),
      );
      await this.repo.markSynced(indicator.id, new Date());
      this.logger.info({ code: indicator.code, upserted }, 'indicator synced');
      return { code: indicator.code, ok: true, upserted };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error({ code: indicator.code, error }, 'indicator sync failed');
      return { code: indicator.code, ok: false, error };
    }
  }

  private fetchRaw(indicator: Indicator): Promise<RawPoint[]> {
    const start = new Date(Date.now() - lookbackDays(indicator) * 24 * 60 * 60 * 1000);
    const end = new Date();

    if (indicator.source === 'BCB') {
      return indicator.sourceSeriesId === 'PTAX'
        ? fetchPtaxSeries(start, end)
        : fetchSgsSeries(indicator.sourceSeriesId, start, end);
    }
    return fetchFredObservations(indicator.sourceSeriesId, this.env.FRED_API_KEY, start);
  }
}
