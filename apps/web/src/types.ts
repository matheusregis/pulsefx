// Mirrors apps/api/src/modules/indicators/indicator.dto.ts. Duplicated
// rather than shared via a package for MVP simplicity — see README §
// Decisões técnicas for the trade-off.

export interface SeriesPoint {
  date: string;
  value: number;
  secondaryValue?: number;
}

export interface IndicatorCard {
  code: string;
  name: string;
  source: 'BCB' | 'FRED';
  unit: string;
  frequency: 'DAILY' | 'MONTHLY';
  variationLabel: string;
  lastSyncedAt: string | null;
  valueLabel: string;
  latestValue: number | null;
  secondaryValueLabel: string | null;
  latestSecondaryValue: number | null;
  referenceDate: string | null;
  variationPercent: number | null;
  variationUnavailableReason: 'insufficient-history' | 'zero-denominator' | null;
}

export interface IndicatorDetail extends IndicatorCard {
  description: string;
  limitations: string;
  historyWindow: number;
  history: SeriesPoint[];
}
