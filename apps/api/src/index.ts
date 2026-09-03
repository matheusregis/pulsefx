import 'dotenv/config';
import pino from 'pino';
import { createApp } from './app';
import { loadEnv } from './config/env';
import { SyncService } from './modules/sync/sync.service';
import { startSyncScheduler } from './modules/sync/sync.scheduler';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
const env = loadEnv();

const syncService = new SyncService(env, logger);
const app = createApp(env, logger, syncService);

startSyncScheduler(env, syncService, logger);

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Pulse FX API listening');
});
