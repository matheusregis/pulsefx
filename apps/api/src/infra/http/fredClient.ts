import type { RawPoint } from './bcbClient';

/**
 * FRED — Federal Reserve Economic Data (St. Louis Fed).
 * Docs: https://fred.stlouisfed.org/docs/api/fred/series_observations.html
 * API key: https://fredaccount.stlouisfed.org/apikeys
 */

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

interface FredObservation {
  date: string; // YYYY-MM-DD
  value: string; // numeric string, or "." when missing
}

interface FredResponse {
  observations: FredObservation[];
}

export async function fetchFredObservations(
  seriesId: string,
  apiKey: string,
  observationStart?: Date,
): Promise<RawPoint[]> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
  });
  if (observationStart) {
    params.set('observation_start', observationStart.toISOString().slice(0, 10));
  }

  const res = await fetch(`${FRED_BASE}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`FRED request failed (series ${seriesId}): ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as FredResponse;

  return body.observations
    .filter((obs) => obs.value !== '.') // "." = missing observation per FRED docs
    .map((obs) => ({ date: obs.date, value: Number(obs.value) }));
}
