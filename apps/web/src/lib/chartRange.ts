import type { SeriesPoint } from '../types';

export interface RangeOption {
  key: string;
  label: string;
  /** How many most-recent points this range shows. */
  points: number;
}

/**
 * Time-range filter options for the detail chart (§4 "adição de filtros").
 * Options are derived from the indicator's frequency and how many points are
 * actually available — a daily series offers 7D/30D/90D/180D, a monthly one
 * 12M/24M/36M, and a window is only offered when it's strictly smaller than
 * the full history (otherwise it's identical to "Tudo" and just clutters
 * the row). "Tudo" is always present.
 */
export function buildRangeOptions(frequency: 'DAILY' | 'MONTHLY', historyLength: number): RangeOption[] {
  const candidates =
    frequency === 'DAILY'
      ? [
          { key: '7D', label: '7D', points: 7 },
          { key: '30D', label: '30D', points: 30 },
          { key: '90D', label: '90D', points: 90 },
          { key: '180D', label: '180D', points: 180 },
        ]
      : [
          { key: '12M', label: '12M', points: 12 },
          { key: '24M', label: '24M', points: 24 },
          { key: '36M', label: '36M', points: 36 },
        ];

  const options = candidates.filter((c) => c.points < historyLength);
  options.push({ key: 'ALL', label: 'Tudo', points: historyLength });
  return options;
}

/** Default selection: the shortest available window (most-recent-focused), like most price-chart UIs. */
export function defaultRangeKey(options: RangeOption[]): string {
  return options[0]?.key ?? 'ALL';
}

/** Returns the most recent `points` entries of an ascending (oldest-first) series. */
export function filterHistory(history: SeriesPoint[], points: number): SeriesPoint[] {
  if (points >= history.length) return history;
  return history.slice(history.length - points);
}
