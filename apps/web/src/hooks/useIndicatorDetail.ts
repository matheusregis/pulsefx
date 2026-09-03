import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import type { IndicatorDetail } from '../types';

interface State {
  indicator: IndicatorDetail | null;
  loading: boolean;
  error: string | null;
}

export function useIndicatorDetail(code: string | undefined) {
  const [state, setState] = useState<State>({ indicator: null, loading: true, error: null });

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    setState({ indicator: null, loading: true, error: null });
    api
      .getIndicator(code)
      .then((indicator) => {
        if (!cancelled) setState({ indicator, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ indicator: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return state;
}
