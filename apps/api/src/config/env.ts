import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  FRED_API_KEY: z.string().min(1, 'FRED_API_KEY is required'),
  ADMIN_SYNC_TOKEN: z.string().min(8, 'ADMIN_SYNC_TOKEN must be at least 8 chars'),
  SYNC_INTERVAL_MINUTES: z.coerce.number().default(180),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates process.env once. Throws early (fail-fast) on boot if
 * required vars are missing, instead of surfacing as a confusing runtime error.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}
