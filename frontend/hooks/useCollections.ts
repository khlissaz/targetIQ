'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchCollections } from '@/services/collectionService';
import { ScrapingI } from '@/lib/types';
import { safeLog, sanitizeError } from '@/lib/safeLogging';

export interface UseCollectionsResult {
  collections: ScrapingI[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCollections(): UseCollectionsResult {
  const [collections, setCollections] = useState<ScrapingI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCollections()
      .then((data) => {
        if (!cancelled) {
          setCollections(Array.isArray(data.items) ? data.items : []);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const se = sanitizeError(err);
          safeLog('error', 'collections.fetch.failed', { message: se.message, code: se.code });
          setError(se.message || 'Failed to load collections');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { collections, loading, error, refresh };
}
