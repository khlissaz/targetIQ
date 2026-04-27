'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TiqProgressTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

export type TiqProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value: number;
  max?: number;
  label?: string;
  tone?: TiqProgressTone;
};

function toneToBarClass(tone: TiqProgressTone) {
  switch (tone) {
    case 'success':
      return 'bg-tiq-success';
    case 'warning':
      return 'bg-tiq-warning';
    case 'danger':
      return 'bg-tiq-danger';
    case 'neutral':
      return 'bg-tiq-muted';
    case 'primary':
    default:
      return 'bg-tiq-primary';
  }
}

export function TiqProgress({
  className,
  value,
  max = 100,
  label,
  tone = 'primary',
  ...props
}: TiqProgressProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const pct = safeMax ? Math.min(100, Math.round((safeValue / safeMax) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={safeMax || undefined}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-tiq-border', className)}
      {...props}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-300', toneToBarClass(tone))}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
