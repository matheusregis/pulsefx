import { describe, expect, it } from 'vitest';
import { formatDate, formatValue, formatVariation } from './format';

describe('formatValue', () => {
  it('formats an "Índice" unit (CPI) without throwing — regression: min/maxFractionDigits must not invert', () => {
    // Bug: minimumFractionDigits was hardcoded to 2 while "Índice" capped
    // maximumFractionDigits at 1, which makes Intl.NumberFormat throw
    // RangeError at runtime (only surfaced once CPI had real data to render).
    expect(() => formatValue(323.048, 'Índice (1982-84=100)')).not.toThrow();
    expect(formatValue(323.048, 'Índice (1982-84=100)')).toBe('323,0 Índice (1982-84=100)');
  });

  it('formats a BRL/USD unit with up to 4 decimals', () => {
    expect(formatValue(5.0962, 'BRL por USD')).toBe('5,0962 BRL por USD');
  });
});

describe('formatVariation', () => {
  it('prefixes positive variation with a + sign and tone "up"', () => {
    expect(formatVariation(4.256)).toEqual({ label: '+4.26%', tone: 'up' });
  });

  it('keeps the - sign for negative variation and tone "down"', () => {
    expect(formatVariation(-1.5)).toEqual({ label: '-1.50%', tone: 'down' });
  });

  it('renders exactly zero as flat, no sign', () => {
    expect(formatVariation(0)).toEqual({ label: '0.00%', tone: 'flat' });
  });

  it('renders null as N/D with tone "unavailable" rather than throwing', () => {
    expect(formatVariation(null)).toEqual({ label: 'N/D', tone: 'unavailable' });
  });
});

describe('formatDate', () => {
  it('converts an ISO date (YYYY-MM-DD) to pt-BR order (DD/MM/YYYY)', () => {
    expect(formatDate('2024-01-12')).toBe('12/01/2024');
  });
});
