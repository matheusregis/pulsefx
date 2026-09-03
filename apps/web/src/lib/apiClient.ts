import { getClientId } from './clientId';
import type { IndicatorCard, IndicatorDetail } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Request failed: ${res.status}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  return body.data as T;
}

export const api = {
  listIndicators: () => request<IndicatorCard[]>('/api/indicators'),
  getIndicator: (code: string) => request<IndicatorDetail>(`/api/indicators/${encodeURIComponent(code)}`),
  listFavorites: () =>
    request<string[]>('/api/favorites', { headers: { 'X-Client-Id': getClientId() } }),
  addFavorite: (code: string) =>
    request<void>(`/api/favorites/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'X-Client-Id': getClientId() },
    }),
  removeFavorite: (code: string) =>
    request<void>(`/api/favorites/${encodeURIComponent(code)}`, {
      method: 'DELETE',
      headers: { 'X-Client-Id': getClientId() },
    }),
};

export { ApiError };
