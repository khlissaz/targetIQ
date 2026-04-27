'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TiqBadge } from './TiqBadge';

export type TiqKpiTone = 'default' | 'success' | 'warning' | 'danger';

export type TiqKpiProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: TiqKpiTone;
  className?: string;
};

function toneToBadgeVariant(tone: TiqKpiTone | undefined) {
  switch (tone) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'danger':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function TiqKpi({ label, value, delta, deltaTone = 'default', className }: TiqKpiProps) {
  return (
    <div className={cn('rounded-tiqLg border border-tiq-border bg-tiq-surface p-4 shadow-tiq', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-tiq-muted">{label}</div>
          <div className="mt-2 text-2xl font-semibold leading-tight text-tiq-navy">{value}</div>
        </div>
        {delta ? <TiqBadge variant={toneToBadgeVariant(deltaTone)}>{delta}</TiqBadge> : null}
      </div>
    </div>
  );
}
