import * as React from 'react';
import { cn } from '@/lib/utils';

export type CreditMeterProps = {
  label: string;
  used: number;
  cap: number;
  helperText?: string;
  tone?: 'primary' | 'warning' | 'danger' | 'success';
  className?: string;
};

export function CreditMeter({ label, used, cap, helperText, tone = 'primary', className }: CreditMeterProps) {
  const safeCap = Number.isFinite(cap) && cap > 0 ? cap : 0;
  const safeUsed = Number.isFinite(used) && used >= 0 ? used : 0;
  const pct = safeCap ? Math.min(100, Math.round((safeUsed / safeCap) * 100)) : 0;

  const barColor =
    tone === 'danger'
      ? 'bg-tiq-danger'
      : tone === 'warning'
        ? 'bg-tiq-warning'
        : tone === 'success'
          ? 'bg-tiq-success'
          : 'bg-tiq-primary';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm font-semibold text-tiq-navy">{label}</div>
        <div className="text-sm text-tiq-muted">
          <span className="font-semibold text-tiq-text">{safeUsed}</span>
          <span className="mx-1">/</span>
          <span>{safeCap}</span>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={safeUsed}
        aria-valuemin={0}
        aria-valuemax={safeCap || undefined}
        className="h-2 w-full overflow-hidden rounded-full bg-tiq-border"
      >
        <div className={cn('h-full rounded-full transition-[width] duration-300', barColor)} style={{ width: `${pct}%` }} />
      </div>

      {helperText && <div className="text-xs text-tiq-muted">{helperText}</div>}
    </div>
  );
}
