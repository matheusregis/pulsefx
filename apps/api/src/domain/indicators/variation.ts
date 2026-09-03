/**
 * Variation rule (see README §"Regra de variação percentual").
 *
 * - "Último valor" = the most recent persisted observation (index 0 of a
 *   date-descending series already limited to what sync has stored).
 * - "Data de referência" = that observation's own date, never "now".
 * - The denominator is the observation `window` *positions* back in the
 *   array of available observations — i.e. "N previous periods that
 *   actually have data" — not N calendar days/months. This is what makes
 *   the same rule correct across weekends/holidays/COPOM-gaps without any
 *   interpolation: a missing day/month simply isn't in the array, so it's
 *   skipped rather than treated as a flat carry-forward.
 * - `window` and its label are defined per indicator (see prisma/seed.ts)
 *   because a daily FX series and a monthly macro series need different N.
 */

export interface SeriesPoint {
  /** ISO date (YYYY-MM-DD) — the observation's reference date. */
  date: string;
  value: number;
}

export type VariationUnavailableReason = 'insufficient-history' | 'zero-denominator';

export interface VariationResult {
  latest: SeriesPoint;
  /** The observation used as denominator, or null when unavailable. */
  compare: SeriesPoint | null;
  /** Percentage variation, or null when it cannot be computed (see `reason`). */
  variationPercent: number | null;
  window: number;
  reason?: VariationUnavailableReason;
}

/**
 * @param observationsDesc Observations sorted by date descending (newest first).
 *   Must contain at least one point.
 * @param window Number of prior *available* observations back to compare against.
 */
export function calculateVariation(observationsDesc: SeriesPoint[], window: number): VariationResult {
  if (observationsDesc.length === 0) {
    throw new Error('calculateVariation requires at least one observation');
  }
  if (window <= 0) {
    throw new Error('window must be a positive integer');
  }

  const latest = observationsDesc[0];
  const compare = observationsDesc[window] ?? null;

  if (!compare) {
    return { latest, compare: null, variationPercent: null, window, reason: 'insufficient-history' };
  }

  if (compare.value === 0) {
    return { latest, compare, variationPercent: null, window, reason: 'zero-denominator' };
  }

  const variationPercent = ((latest.value - compare.value) / Math.abs(compare.value)) * 100;

  return { latest, compare, variationPercent, window };
}
