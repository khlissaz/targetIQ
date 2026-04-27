'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCredits, CreditsInfo } from '@/lib/api';

export type CreditState = 'idle' | 'loading' | 'ok' | 'upgrade' | 'dailyCap' | 'error';

export interface UseCreditsResult {
  state: CreditState;
  credits: CreditsInfo | null;
  refresh: () => void;
}

export function useCredits(): UseCreditsResult {
  const [state, setState] = useState<CreditState>('idle');
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    getCredits()
      .then((c) => {
        if (!cancelled) {
          setCredits(c);
          setState('ok');
        }
      })
      .catch((e: any) => {
        if (cancelled) return;
        const status = typeof e?.status === 'number' ? e.status : 0;
        if (status === 402) setState('upgrade');
        else if (status === 429) setState('dailyCap');
        else setState('error');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { state, credits, refresh };
}
