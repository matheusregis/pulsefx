import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import type { IndicatorCard } from '../types';

interface State {
  indicators: IndicatorCard[];
  loading: boolean;
  error: string | null;
}

export function useIndicators() {
  const [state, setState] = useState<State>({ indicators: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .listIndicators()
      .then((indicators) => {
        if (!cancelled) setState({ indicators, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ indicators: [], loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
