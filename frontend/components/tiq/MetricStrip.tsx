'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type MetricTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface MetricItem {
  label: string;
  value: React.ReactNode;
  description?: string;
  tone?: MetricTone;
  icon?: React.ElementType;
  className?: string;
}

const toneClasses: Record<MetricTone, string> = {
  default: 'text-tiq-navy',
  success: 'text-tiq-success',
  warning: 'text-tiq-warning',
  danger: 'text-tiq-danger',
  info: 'text-tiq-info',
};

const toneBg: Record<MetricTone, string> = {
  default: 'bg-tiq-bg border-tiq-border',
  success: 'bg-tiq-success/5 border-tiq-success/20',
  warning: 'bg-tiq-warning/5 border-tiq-warning/20',
  danger: 'bg-tiq-danger/5 border-tiq-danger/20',
  info: 'bg-tiq-info/5 border-tiq-info/20',
};

export interface MetricStripProps {
  metrics: MetricItem[];
  /** 2-5 columns; defaults to auto (equal share grid) */
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}

const colsClass: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
};

export function MetricStrip({ metrics, cols = 4, className }: MetricStripProps) {
  const gridCls = colsClass[cols] ?? 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className={cn('grid gap-4', gridCls, className)}>
      {metrics.map((m, idx) => {
        const tone = m.tone ?? 'default';
        const Icon = m.icon;
        return (
          <div
            key={idx}
            className={cn(
              'rounded-xl border p-4',
              toneBg[tone],
              m.className,
            )}
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon className={cn('h-4 w-4', toneClasses[tone])} />}
              <p className="text-xs font-medium text-tiq-muted">{m.label}</p>
            </div>
            <p className={cn('mt-2 text-2xl font-bold', toneClasses[tone])}>
              {m.value}
            </p>
            {m.description && (
              <p className="mt-1 text-xs text-tiq-muted">{m.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
