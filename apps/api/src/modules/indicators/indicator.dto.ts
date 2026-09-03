import type { Indicator, Observation } from '@prisma/client';
import type { SeriesPoint, VariationResult } from '../../domain/indicators/variation';

export function toSeriesPoints(observations: Observation[]): SeriesPoint[] {
  return observations.map((o) => ({
    date: o.date.toISOString().slice(0, 10),
    value: Number(o.value),
    secondaryValue: o.secondaryValue !== null ? Number(o.secondaryValue) : undefined,
  }));
}

export interface IndicatorCardDTO {
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
  variationUnavailableReason: VariationResult['reason'] | null;
}

export interface IndicatorDetailDTO extends IndicatorCardDTO {
  description: string;
  limitations: string;
  historyWindow: number;
  history: SeriesPoint[]; // ascending, oldest first — chart-ready
}

export function toCardDTO(indicator: Indicator, variation: VariationResult | null): IndicatorCardDTO {
  return {
    code: indicator.code,
    name: indicator.name,
    source: indicator.source,
    unit: indicator.unit,
    frequency: indicator.frequency,
    variationLabel: indicator.variationLabel,
    lastSyncedAt: indicator.lastSyncedAt ? indicator.lastSyncedAt.toISOString() : null,
    valueLabel: indicator.valueLabel,
    latestValue: variation ? variation.latest.value : null,
    secondaryValueLabel: indicator.secondaryValueLabel,
    latestSecondaryValue: variation?.latest.secondaryValue ?? null,
    referenceDate: variation ? variation.latest.date : null,
    variationPercent: variation ? variation.variationPercent : null,
    variationUnavailableReason: variation?.reason ?? null,
  };
}
