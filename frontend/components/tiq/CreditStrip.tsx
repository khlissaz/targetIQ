'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCredits, CreditsInfo } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

type CreditState = 'idle' | 'loading' | 'ok' | 'upgrade' | 'dailyCap' | 'error';

function usagePct(used: number, cap: number | null): number {
  if (!cap || cap <= 0) return 0;
  return Math.round((used / cap) * 100);
}

function numClass(pct: number): string {
  if (pct >= 90) return 'text-tiq-danger';
  if (pct >= 70) return 'text-tiq-warning';
  return 'text-tiq-text';
}

function SkeletonPill() {
  return (
    <div className="h-5 w-28 animate-pulse rounded-full bg-tiq-border/50" />
  );
}

export function CreditStrip() {
  const router = useRouter();
  const params = useParams();
  const businessId =
    typeof params?.businessId === 'string'
      ? params.businessId
      : Array.isArray(params?.businessId)
        ? params.businessId[0]
        : null;

  const [state, setState] = useState<CreditState>('idle');
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  useEffect(() => {
    let cancelled = false;

    const fetchCredits = () => {
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
    };

    fetchCredits();
    const interval = setInterval(fetchCredits, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleClick = () => {
    const dest = businessId
      ? `/dashboard/${businessId}/billing`
      : '/dashboard';
    router.push(dest);
  };

  if (state === 'loading' || state === 'idle') {
    return (
      <div className="flex items-center gap-2">
        <SkeletonPill />
        <SkeletonPill />
      </div>
    );
  }

  if (state === 'upgrade') {
    return (
      <button
        onClick={handleClick}
        className="rounded-full bg-tiq-primary/10 px-3 py-1 text-xs font-medium text-tiq-primary border border-tiq-primary/20 hover:opacity-80 transition-opacity"
      >
        {t('credits.exhaustedUpgrade')}
      </button>
    );
  }

  if (state === 'dailyCap') {
    return (
      <button
        onClick={handleClick}
        className="rounded-full bg-tiq-danger/10 px-3 py-1 text-xs font-medium text-tiq-danger border border-tiq-danger/20 hover:opacity-80 transition-opacity"
      >
        {t('credits.dailyCap')}
      </button>
    );
  }

  if (!credits) return null;

  const capturePct = usagePct(
    credits.capture?.monthlyUsed ?? 0,
    credits.capture?.monthlyCap ?? null,
  );
  const enrichPct = usagePct(
    credits.enrich?.monthlyUsed ?? 0,
    credits.enrich?.monthlyCap ?? null,
  );

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-tiq-muted">
        {t('credits.capture')}{' '}
        <span className={cn('font-medium', numClass(capturePct))}>
          {credits.capture?.monthlyUsed ?? 0}
        </span>
        /{credits.capture?.monthlyCap ?? '∞'}
      </span>
      <span className="text-tiq-border">|</span>
      <span className="text-tiq-muted">
        {t('credits.enrich')}{' '}
        <span className={cn('font-medium', numClass(enrichPct))}>
          {credits.enrich?.monthlyUsed ?? 0}
        </span>
        /{credits.enrich?.monthlyCap ?? '∞'}
      </span>
    </div>
  );
}
