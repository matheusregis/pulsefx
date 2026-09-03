import cron from 'node-cron';
import type { Logger } from 'pino';
import type { Env } from '../../config/env';
import type { SyncService } from './sync.service';

/**
 * TTL/refresh policy (§4 "Sincronização"): a background job runs every
 * `SYNC_INTERVAL_MINUTES` (default 180) and upserts fresh observations.
 * Reads (dashboard/detail) never call BCB/FRED directly — this is the only
 * scheduled writer, plus the admin-protected manual endpoint in
 * sync.routes.ts. Together they bound external calls to a fixed cadence
 * instead of one call per page view.
 */
export function startSyncScheduler(env: Env, syncService: SyncService, logger: Logger): void {
  const everyNMinutes = `*/${env.SYNC_INTERVAL_MINUTES} * * * *`;

  cron.schedule(everyNMinutes, () => {
    logger.info('scheduled sync starting');
    syncService
      .syncAll()
      .then((results) => logger.info({ results }, 'scheduled sync finished'))
      .catch((err) => logger.error({ err }, 'scheduled sync crashed'));
  });

  logger.info({ intervalMinutes: env.SYNC_INTERVAL_MINUTES }, 'sync scheduler started');
}
