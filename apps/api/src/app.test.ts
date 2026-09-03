import pino from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { loadEnv } from './config/env';
import { SyncService } from './modules/sync/sync.service';

function buildTestApp() {
  const env = loadEnv({
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    FRED_API_KEY: 'test-key',
    ADMIN_SYNC_TOKEN: 'x'.repeat(8),
  });
  const logger = pino({ level: 'silent' });
  const syncService = new SyncService(env, logger);
  return createApp(env, logger, syncService);
}

describe('createApp — error handling wiring', () => {
  it('GET /health returns 200', async () => {
    const res = await request(buildTestApp()).get('/health');
    expect(res.status).toBe(200);
  });

  it('returns 404 (not 500) for an unmatched route', async () => {
    const res = await request(buildTestApp()).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 400 (not 500) for a malformed JSON body', async () => {
    // Regression: the error handler used to flatten every error — including
    // express.json()'s SyntaxError for bad JSON — to a generic 500.
    const res = await request(buildTestApp())
      .post('/api/admin/sync')
      .set('Content-Type', 'application/json')
      .send('{not valid json');

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});
