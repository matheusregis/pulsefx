import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/apiClient';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listFavorites()
      .then((codes) => setFavorites(new Set(codes)))
      .catch(() => setFavorites(new Set()))
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback(async (code: string) => {
    const isFav = favorites.has(code);

    // Optimistic update, rolled back on failure — favorites are a low-stakes
    // UI affordance, no need to block the click on a round-trip.
    setFavorites((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(code) : next.add(code);
      return next;
    });

    try {
      await (isFav ? api.removeFavorite(code) : api.addFavorite(code));
    } catch {
      setFavorites((prev) => {
        const next = new Set(prev);
        isFav ? next.add(code) : next.delete(code);
        return next;
      });
    }
  }, [favorites]);

  return { favorites, loading, toggle };
}
