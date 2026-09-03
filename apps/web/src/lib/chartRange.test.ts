import { describe, expect, it } from 'vitest';
import { buildRangeOptions, defaultRangeKey, filterHistory } from './chartRange';
import type { SeriesPoint } from '../types';

const points = (n: number): SeriesPoint[] =>
  Array.from({ length: n }, (_, i) => ({ date: `2024-01-${String(i + 1).padStart(2, '0')}`, value: i }));

describe('buildRangeOptions', () => {
  it('offers only daily windows strictly smaller than the available history, plus Tudo', () => {
    const options = buildRangeOptions('DAILY', 90);
    expect(options.map((o) => o.key)).toEqual(['7D', '30D', 'ALL']);
    expect(options.at(-1)).toEqual({ key: 'ALL', label: 'Tudo', points: 90 });
  });

  it('offers monthly windows for a MONTHLY indicator', () => {
    const options = buildRangeOptions('MONTHLY', 36);
    expect(options.map((o) => o.key)).toEqual(['12M', '24M', 'ALL']);
  });

  it('falls back to just "Tudo" when history is smaller than every candidate window', () => {
    const options = buildRangeOptions('DAILY', 5);
    expect(options).toEqual([{ key: 'ALL', label: 'Tudo', points: 5 }]);
  });

  it('drops windows listed in excludeWindows (e.g. 7D for an event-driven series like Selic)', () => {
    const options = buildRangeOptions('DAILY', 180, [7]);
    expect(options.map((o) => o.key)).toEqual(['30D', '90D', 'ALL']);
  });
});

describe('defaultRangeKey', () => {
  it('picks the shortest (first) option', () => {
    expect(defaultRangeKey(buildRangeOptions('DAILY', 90))).toBe('7D');
  });

  it('falls back to ALL when options is empty', () => {
    expect(defaultRangeKey([])).toBe('ALL');
  });
});

describe('filterHistory', () => {
  it('returns the last N points of an ascending series', () => {
    const result = filterHistory(points(10), 3);
    expect(result.map((p) => p.value)).toEqual([7, 8, 9]);
  });

  it('returns the full series when points requested >= length', () => {
    const series = points(5);
    expect(filterHistory(series, 5)).toBe(series);
    expect(filterHistory(series, 100)).toBe(series);
  });
});
