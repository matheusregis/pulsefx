import { describe, expect, it } from 'vitest';
import { calculateVariation, type SeriesPoint } from './variation';

const points = (values: number[]): SeriesPoint[] =>
  values.map((value, i) => ({
    date: `2024-01-${String(values.length - i).padStart(2, '0')}`,
    value,
  }));

describe('calculateVariation', () => {
  it('computes D/D-1 style variation (window=1) against the previous available point', () => {
    // newest first: 5.20 (latest) then 5.00 one position back
    const result = calculateVariation(points([5.2, 5.0, 4.9]), 1);
    expect(result.latest.value).toBe(5.2);
    expect(result.compare?.value).toBe(5.0);
    expect(result.variationPercent).toBeCloseTo(4, 5); // (5.2-5.0)/5.0 * 100
  });

  it('skips gaps by construction: window counts available observations, not calendar days', () => {
    // Series already has weekends/holidays removed upstream, so window=1
    // naturally compares Friday's close to the prior business day, never Sunday.
    const series: SeriesPoint[] = [
      { date: '2024-01-12', value: 5.1 }, // Friday
      { date: '2024-01-11', value: 5.0 }, // Thursday
    ];
    const result = calculateVariation(series, 1);
    expect(result.compare?.date).toBe('2024-01-11');
    expect(result.variationPercent).toBeCloseTo(2, 5);
  });

  it('supports a YoY-style window (e.g. 12 for monthly CPI)', () => {
    const values = Array.from({ length: 13 }, (_, i) => 112 - i); // index 0 = latest = 112, ... index 12 = 100
    const result = calculateVariation(points(values), 12);
    expect(result.latest.value).toBe(112);
    expect(result.compare?.value).toBe(100);
    expect(result.variationPercent).toBeCloseTo(12, 5);
  });

  it('returns null variation with reason "insufficient-history" when there are not enough prior points', () => {
    const result = calculateVariation(points([5.2, 5.0]), 12);
    expect(result.variationPercent).toBeNull();
    expect(result.compare).toBeNull();
    expect(result.reason).toBe('insufficient-history');
  });

  it('returns null variation with reason "zero-denominator" instead of dividing by zero', () => {
    const result = calculateVariation(points([5.2, 0]), 1);
    expect(result.variationPercent).toBeNull();
    expect(result.reason).toBe('zero-denominator');
  });

  it('throws on empty input rather than silently returning a bogus result', () => {
    expect(() => calculateVariation([], 1)).toThrow();
  });

  it('throws on a non-positive window', () => {
    expect(() => calculateVariation(points([1, 2]), 0)).toThrow();
  });
});
