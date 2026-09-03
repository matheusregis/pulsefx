import { defineConfig } from 'vitest/config';

// Separate config so `npm test` (unit-only, no external deps) stays fast and
// deterministic in CI, while `npm run test:integration` opts into a real
// Postgres via DATABASE_URL (see README § Testes).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
