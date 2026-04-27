'use client';

import * as React from 'react';
import { TiqProgress } from '@/components/tiq/TiqProgress';
import { TiqSkeleton } from '@/components/tiq/TiqSkeleton';
import { type BillingUsageDto } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

function percent(used: number, cap: number | null): number {
  if (!cap || cap <= 0) return 0;
  return Math.min(100, Math.round((used / cap) * 100));
}

function barColor(pct: number): string {
  if (pct >= 90) return 'bg-tiq-danger';
  if (pct >= 70) return 'bg-tiq-warning';
  return 'bg-tiq-primary';
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

export interface BillingSummaryPanelProps {
  usage: BillingUsageDto | null;
  loading?: boolean;
  className?: string;
}

export function BillingSummaryPanel({ usage, loading, className }: BillingSummaryPanelProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  if (loading) {
    return (
      <div className={cn('space-y-4 rounded-xl border border-tiq-border bg-white p-4', className)}>
        <TiqSkeleton className="h-4 w-32" />
        <TiqSkeleton className="h-3 w-full" />
        <TiqSkeleton className="h-3 w-full" />
      </div>
    );
  }

  if (!usage) return null;

  const capturePct = percent(usage.capture?.monthlyUsed, usage.capture?.monthlyCap);
  const enrichPct = percent(usage.enrich?.monthlyUsed, usage.enrich?.monthlyCap);
  const addonBalance = typeof usage.addonBalance === 'number' ? usage.addonBalance : 0;

  return (
    <div className={cn('space-y-4 rounded-xl border border-tiq-border bg-white p-4', className)}>
      {/* Plan + renewal */}
      <div className="flex items-center justify-between gap-3 text-sm">
        <div>
          <span className="font-medium text-tiq-navy">{usage.plan ?? '—'}</span>
          <span className="ms-1.5 text-tiq-muted">{t('billing.planSuffix')}</span>
        </div>
        <span className="text-xs text-tiq-muted">
          {t('billing.renewsDate').replace('{{date}}', formatDate(usage.renewalDate))}
        </span>
      </div>

      {/* Capture credits */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-tiq-muted">{t('credits.capture')}</span>
          <span
            className={cn(
              'font-medium',
              capturePct >= 90
                ? 'text-tiq-danger'
                : capturePct >= 70
                  ? 'text-tiq-warning'
                  : 'text-tiq-navy',
            )}
          >
            {usage.capture?.monthlyUsed} / {usage.capture?.monthlyCap ?? '∞'}
          </span>
        </div>
        <TiqProgress value={capturePct} className={barColor(capturePct)} />
      </div>

      {/* Enrich credits */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-tiq-muted">{t('credits.enrich')}</span>
          <span
            className={cn(
              'font-medium',
              enrichPct >= 90
                ? 'text-tiq-danger'
                : enrichPct >= 70
                  ? 'text-tiq-warning'
                  : 'text-tiq-navy',
            )}
          >
            {usage.enrich?.monthlyUsed} / {usage.enrich?.monthlyCap ?? '∞'}
          </span>
        </div>
        <TiqProgress value={enrichPct} className={barColor(enrichPct)} />
      </div>

      {/* Add-on balance */}
      {addonBalance > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-tiq-primary/20 bg-tiq-primary/5 px-3 py-2 text-xs">
          <span className="text-tiq-muted">{t('billing.addonBalanceLabel')}</span>
          <span className="font-semibold text-tiq-primary">{addonBalance}</span>
        </div>
      )}
    </div>
  );
}
