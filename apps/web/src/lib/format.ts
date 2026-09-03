export function formatValue(value: number, unit: string): string {
  // Índice (CPI) is quoted to 1 decimal; everything else to up to 4. min must
  // never exceed max or Intl.NumberFormat throws RangeError at runtime.
  const maximumFractionDigits = unit.includes('Índice') ? 1 : 4;
  const minimumFractionDigits = Math.min(2, maximumFractionDigits);
  const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits, maximumFractionDigits }).format(value);
  return `${formatted} ${unit}`;
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export type VariationTone = 'up' | 'down' | 'flat' | 'unavailable';

export function formatVariation(percent: number | null): { label: string; tone: VariationTone } {
  if (percent === null) return { label: 'N/D', tone: 'unavailable' };
  const tone: VariationTone = percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat';
  const sign = percent > 0 ? '+' : '';
  return { label: `${sign}${percent.toFixed(2)}%`, tone };
}
